import { Readable } from "stream";
// Helper to convert Web ReadableStream to Node.js Readable
function webStreamToNode(stream: ReadableStream<Uint8Array>): Readable {
  const reader = stream.getReader();
  return new Readable({
    async read() {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        this.push(Buffer.from(value));
      }
      this.push(null);
    },
  });
}
import { NextResponse } from "next/server";
import Busboy from "busboy";
import sharp from "sharp";
import { isMagicValid } from "../../../../utils/magicNumber";

export const runtime = "nodejs";

// --- Simple in-memory rate limiting (per IP) ---
const RATE_LIMIT = 10; // requests per minute
const WINDOW = 60 * 1000;
if (!(globalThis as { rateLimitStore?: Record<string, number[]> }).rateLimitStore) {
  (globalThis as { rateLimitStore?: Record<string, number[]> }).rateLimitStore = {};
}
const store = (globalThis as unknown as { rateLimitStore: Record<string, number[]> }).rateLimitStore;

export async function POST(req: Request): Promise<Response> {
  const log = (...args: unknown[]) => console.log(`[ImageAPI]`, ...args);
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  log(`Request from IP: ${ip} at ${new Date(now).toISOString()}`);
  if (!store[ip]) store[ip] = [];
  store[ip] = store[ip].filter((ts) => now - ts < WINDOW);
  if (store[ip].length >= RATE_LIMIT) {
    log(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  store[ip].push(now);

  if (!req.body) {
    log(`Missing request body from IP: ${ip}`);
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  // Move originalBaseName outside the Promise to ensure correct scoping
  let originalBaseName = "converted";

  return await new Promise<Response>((resolve) => {
    let fileBuffer: Buffer | null = null;
    let format = "";
    let fileExt = "";
    let fileFieldFound = false;
    let formatFieldFound = false;
    const supportedInputTypes = ["png", "jpg", "jpeg", "webp", "gif", "tiff", "bmp"];
    const supportedOutputFormats = ["png", "jpeg", "webp", "gif", "tiff", "bmp"];

    const busboy = Busboy({ headers: Object.fromEntries(req.headers.entries()), limits: { fileSize: 25 * 1024 * 1024 } });
    const chunks: Buffer[] = [];

    busboy.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: unknown) => {
      fileFieldFound = true;
      let name = "";
      if (typeof filename === "string") {
        name = filename;
      } else if (filename && typeof filename === "object" && "filename" in filename) {
        name = (filename as { filename: string }).filename;
      }
      log(`Received file: filename=${name}`);
      // Extract base name (without extension) for download
      if (name && name.trim()) {
        const lastDot = name.lastIndexOf(".");
        if (lastDot > 0) {
          originalBaseName = name.substring(0, lastDot);
        } else {
          originalBaseName = name;
        }
      }
      fileExt = name.split(".").pop()?.toLowerCase() || "";
      if (!supportedInputTypes.includes(fileExt)) {
        log(`Rejected file: unsupported extension (${fileExt})`);
        file.resume();
        return;
      }
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });
      file.on("limit", () => {
        log(`File too large (max 25MB)`);
        resolve(NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 }));
      });
    });

    busboy.on("field", (fieldname: string, val: string) => {
      if (fieldname === "format") {
        format = val;
        formatFieldFound = true;
      }
    });

    busboy.on("finish", async () => {
      if (!fileFieldFound || !formatFieldFound) {
        log(`Missing file or format field in request`);
        return resolve(NextResponse.json({ error: "Missing file or format" }, { status: 400 }));
      }
      if (!supportedOutputFormats.includes(format)) {
        log(`Unsupported output format: ${format}`);
        return resolve(NextResponse.json({ error: `Unsupported output format: ${format}` }, { status: 400 }));
      }
      if (!supportedInputTypes.includes(fileExt)) {
        log(`Unsupported input file type: ${fileExt}`);
        return resolve(NextResponse.json({ error: `Unsupported input file type: ${fileExt}` }, { status: 400 }));
      }
      fileBuffer = Buffer.concat(chunks);
      // Magic number validation
      const magicValid = isMagicValid(fileExt, fileBuffer);
      if (!magicValid) {
        log(`Magic number validation failed for fileExt: ${fileExt}`);
        return resolve(NextResponse.json({ error: "File content does not match its extension (magic number validation failed)." }, { status: 400 }));
      }
      let converted: Buffer;
      try {
        converted = await sharp(fileBuffer)
          .toFormat(format as keyof sharp.FormatEnum)
          .toBuffer();
      } catch (e) {
        log(`Image conversion failed:`, e);
        return resolve(NextResponse.json({ error: "Conversion failed" }, { status: 500 }));
      }
      const downloadName = `${originalBaseName}.${format}`;
      log(`Conversion successful: ${downloadName} (${fileExt} -> ${format}) for IP: ${ip}`);
      return resolve(new NextResponse(converted, {
        status: 200,
        headers: {
          "Content-Type": `image/${format}`,
          "Content-Disposition": `attachment; filename=\"${downloadName}\"`,
        },
      }));
    });

    // Convert Web ReadableStream to Node.js Readable for Busboy
    const nodeStream = webStreamToNode(req.body as ReadableStream<Uint8Array>);
    nodeStream.pipe(busboy);
  });
}
