
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
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const log = (...args: unknown[]) => console.log(`[PDFMergeAPI]`, ...args);
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  log(`Request from IP: ${ip}`);

  if (!req.body) {
    log(`Missing request body from IP: ${ip}`);
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  return await new Promise<Response>((resolve) => {
    const pdfBuffers: Buffer[] = [];
    let fileCount = 0;
    const busboy = Busboy({ headers: Object.fromEntries(req.headers.entries()), limits: { files: 10, fileSize: 20 * 1024 * 1024 } });

    busboy.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: unknown) => {
      const name = typeof filename === "string" ? filename : `document${fileCount + 1}.pdf`;
      log(`Received file: filename=${name}`);
      const chunks: Buffer[] = [];
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });
      file.on("end", () => {
        pdfBuffers.push(Buffer.concat(chunks));
        fileCount++;
      });
      file.on("limit", () => {
        log(`File too large (max 20MB)`);
        resolve(NextResponse.json({ error: "File too large (max 20MB)" }, { status: 413 }));
      });
    });

    busboy.on("finish", async () => {
      if (pdfBuffers.length < 2) {
        log(`At least two PDF files required for merge`);
        return resolve(NextResponse.json({ error: "At least two PDF files required for merge" }, { status: 400 }));
      }
      try {
        const mergedPdf = await PDFDocument.create();
        for (const buffer of pdfBuffers) {
          const srcPdf = await PDFDocument.load(buffer);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        log(`PDFs merged successfully for IP: ${ip}`);
        return resolve(new NextResponse(Buffer.from(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=\"merged.pdf\"`,
          },
        }));
      } catch (e) {
        log(`PDF merge failed:`, e);
        return resolve(NextResponse.json({ error: "PDF merge failed" }, { status: 500 }));
      }
    });

    const nodeStream = webStreamToNode(req.body as ReadableStream<Uint8Array>);
    nodeStream.pipe(busboy);
  });
}
