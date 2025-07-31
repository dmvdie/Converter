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
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { isMagicValid } from "../../../../utils/magicNumber";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const log = (...args: unknown[]) => console.log(`[PdfAPI]`, ...args);
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  log(`Request from IP: ${ip} at ${new Date(now).toISOString()}`);
  if (!req.body) {
    log(`Missing request body from IP: ${ip}`);
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }
  return await new Promise<Response>((resolve) => {
    let fileBuffer: Buffer | null = null;
    let fileExt = "";
    let fileFieldFound = false;
    let originalBaseName = "converted";
    const supportedInputTypes = [
      "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "txt"
    ];
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
    busboy.on("finish", async () => {
      if (!fileFieldFound) {
        log(`Missing file field in request`);
        return resolve(NextResponse.json({ error: "Missing file" }, { status: 400 }));
      }
      if (!supportedInputTypes.includes(fileExt)) {
        log(`Unsupported input file type for PDF conversion: ${fileExt}`);
        return resolve(NextResponse.json({ error: `Unsupported input file type for PDF conversion: ${fileExt}` }, { status: 400 }));
      }
      fileBuffer = Buffer.concat(chunks);
      // Magic number validation
      if (!isMagicValid(fileExt, fileBuffer)) {
        log(`Magic number validation failed for fileExt: ${fileExt}`);
        return resolve(NextResponse.json({ error: "File content does not match its extension (magic number validation failed)." }, { status: 400 }));
      }
      // Save to temp file
      const tempDir = path.join(process.cwd(), "tmp");
      await fs.mkdir(tempDir, { recursive: true });
      const inputPath = path.join(tempDir, `input_${Date.now()}`);
      const outputPath = `${inputPath}.pdf`;
      await fs.writeFile(inputPath, fileBuffer);
      // Use libreoffice to convert
      try {
        await new Promise<void>((resolveConv, rejectConv) => {
          // Use the full path to soffice.exe for Windows
          const sofficePath = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
          const proc = spawn(sofficePath, [
            "--headless",
            "--convert-to",
            "pdf",
            inputPath,
            "--outdir",
            tempDir,
          ]);
          proc.on("exit", (code) =>
            code === 0 ? resolveConv() : rejectConv(new Error("LibreOffice failed")),
          );
          proc.on("error", rejectConv);
        });
        const pdfBuffer = await fs.readFile(outputPath);
        await fs.unlink(inputPath);
        log(`Deleted temp file: ${inputPath}`);
        await fs.unlink(outputPath);
        log(`Deleted temp file: ${outputPath}`);
        const downloadName = `${originalBaseName}.pdf`;
        log(`Conversion successful: ${downloadName} (${fileExt} -> pdf) for IP: ${ip}`);
        return resolve(new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=\"${downloadName}\"`,
          },
        }));
      } catch (err) {
        log(`PDF conversion failed:`, err);
        return resolve(NextResponse.json({ error: "PDF conversion failed", details: String(err) }, { status: 500 }));
      }
    });
    // Convert Web ReadableStream to Node.js Readable for Busboy
    const nodeStream = webStreamToNode(req.body as ReadableStream<Uint8Array>);
    nodeStream.pipe(busboy);
  });
}
