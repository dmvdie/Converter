import { Readable } from "stream";
// Helper to convert Web ReadableStream to Node.js Readable
function webStreamToNode(stream: any): Readable {
  // If it's already a Node.js Readable, return as is
  if (stream && typeof stream.pipe === 'function' && typeof stream.read === 'function') {
    return stream;
  }
  // Otherwise, treat as Web ReadableStream
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
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const log = (...args: unknown[]) => console.log(`[PDFSplitAPI]`, ...args);
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  log(`Request from IP: ${ip}`);

  if (!req.body) {
    log(`Missing request body from IP: ${ip}`);
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  return await new Promise<Response>((resolve) => {
    let fileBuffer: Buffer | null = null;
    let pageNum = 1;
    let fileFieldFound = false;
    let pageFieldFound = false;
    let originalBaseName = "extracted";
    let originalNameField = null;
    const chunks: Buffer[] = [];
    const busboy = Busboy({ headers: Object.fromEntries(req.headers.entries()), limits: { fileSize: 20 * 1024 * 1024 } });

    busboy.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: unknown) => {
      fileFieldFound = true;
      const name = typeof filename === "string" ? filename : "document.pdf";
      log(`Received file: filename=${name}`);
      if (name && name.trim()) {
        const lastDot = name.lastIndexOf(".");
        originalBaseName = lastDot > 0 ? name.substring(0, lastDot) : name;
      }
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });
      file.on("limit", () => {
        log(`File too large (max 20MB)`);
        resolve(NextResponse.json({ error: "File too large (max 20MB)" }, { status: 413 }));
      });
    });

    busboy.on("field", (fieldname: string, val: string) => {
      if (fieldname === "originalName") {
        originalNameField = val;
        if (originalNameField && originalNameField.trim()) {
          const lastDot = originalNameField.lastIndexOf(".");
          originalBaseName = lastDot > 0 ? originalNameField.substring(0, lastDot) : originalNameField;
        }
      }
    });

    busboy.on("field", (fieldname: string, val: string) => {
      if (fieldname === "page") {
        pageNum = parseInt(val, 10);
        pageFieldFound = true;
      }
    });

    busboy.on("finish", async () => {
      if (!fileFieldFound || !pageFieldFound) {
        log(`Missing file or page field in request`);
        return resolve(NextResponse.json({ error: "Missing file or page" }, { status: 400 }));
      }
      fileBuffer = Buffer.concat(chunks);
      try {
        const srcPdf = await PDFDocument.load(fileBuffer);
        const totalPages = srcPdf.getPageCount();
        if (pageNum < 1 || pageNum > totalPages) {
          log(`Invalid page number: ${pageNum} (PDF has ${totalPages} pages)`);
          return resolve(NextResponse.json({ error: `Invalid page number: ${pageNum}. PDF has ${totalPages} page(s).` }, { status: 400 }));
        }
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(srcPdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const downloadName = `${originalBaseName}_page${pageNum}.pdf`;
        log(`Page ${pageNum} extracted successfully for IP: ${ip}`);
        return resolve(new NextResponse(Buffer.from(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=\"${downloadName}\"`,
          },
        }));
      } catch (e) {
        log(`PDF split failed:`, e);
        return resolve(NextResponse.json({ error: "PDF split failed" }, { status: 500 }));
      }
    });

    // Convert Web ReadableStream to Node.js Readable for Busboy
    const nodeStream = webStreamToNode(req.body as ReadableStream<Uint8Array>);
    nodeStream.pipe(busboy);
  });
}
