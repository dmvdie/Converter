
import { NextResponse } from "next/server";
import Busboy from "busboy";
import sharp from "sharp";
import { isMagicValid } from "../../../utils/magicNumber";

export const runtime = "nodejs";

// --- Simple in-memory rate limiting (per IP) ---
const RATE_LIMIT = 10; // requests per minute
const WINDOW = 60 * 1000;
if (!(globalThis as { rateLimitStore?: Record<string, number[]> }).rateLimitStore) {
  (globalThis as { rateLimitStore?: Record<string, number[]> }).rateLimitStore = {};
}
const store = (globalThis as unknown as { rateLimitStore: Record<string, number[]> }).rateLimitStore;

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  if (!store[ip]) store[ip] = [];
  store[ip] = store[ip].filter((ts) => now - ts < WINDOW);
  if (store[ip].length >= RATE_LIMIT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  store[ip].push(now);

  if (!req.body) {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  return await new Promise<Response>((resolve) => {
    let fileBuffer: Buffer | null = null;
    // fileName is not used, so removed to fix unused var warning
    let format = "";
    let fileExt = "";
    let fileFieldFound = false;
    let formatFieldFound = false;
    const supportedInputTypes = ["png", "jpg", "jpeg", "webp", "gif", "tiff", "bmp"];
    const supportedOutputFormats = ["png", "jpeg", "webp", "gif", "tiff", "bmp"];

    const busboy = Busboy({ headers: Object.fromEntries(req.headers.entries()), limits: { fileSize: 25 * 1024 * 1024 } });
    const chunks: Buffer[] = [];

    busboy.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: string) => {
      fileFieldFound = true;
      // fileName assignment removed (was unused)
      fileExt = filename.split(".").pop()?.toLowerCase() || "";
      if (!supportedInputTypes.includes(fileExt)) {
        file.resume();
        return;
      }
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });
      file.on("limit", () => {
        resolve(NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 }));
      });
    });

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "format") {
        format = val;
        formatFieldFound = true;
      }
    });

    busboy.on("finish", async () => {
      if (!fileFieldFound || !formatFieldFound) {
        return resolve(NextResponse.json({ error: "Missing file or format" }, { status: 400 }));
      }
      if (!supportedOutputFormats.includes(format)) {
        return resolve(NextResponse.json({ error: `Unsupported output format: ${format}` }, { status: 400 }));
      }
      if (!supportedInputTypes.includes(fileExt)) {
        return resolve(NextResponse.json({ error: `Unsupported input file type: ${fileExt}` }, { status: 400 }));
      }
      fileBuffer = Buffer.concat(chunks);
      // Magic number validation
      if (!isMagicValid(fileExt, fileBuffer)) {
        return resolve(NextResponse.json({ error: "File content does not match its extension (magic number validation failed)." }, { status: 400 }));
      }
      let converted: Buffer;
      try {
        converted = await sharp(fileBuffer)
          .toFormat(format as keyof sharp.FormatEnum)
          .toBuffer();
      } catch (e) {
        return resolve(NextResponse.json({ error: "Conversion failed" }, { status: 500 }));
      }
      const filename = `converted.${format}`;
      return resolve(new NextResponse(converted, {
        status: 200,
        headers: {
          "Content-Type": `image/${format}`,
          "Content-Disposition": `attachment; filename=\"${filename}\"`,
        },
      }));
    });

    // @ts-expect-error Busboy expects a Node.js stream, but req.body is a ReadableStream in Next.js API routes
    req.body.pipe(busboy);
  });
}
