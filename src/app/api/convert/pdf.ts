import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { isMagicValid } from "../../../utils/magicNumber";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const supportedInputTypes = [
    "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "txt"
  ];
  const inputExt = file.name.split(".").pop()?.toLowerCase() || "";
  if (!supportedInputTypes.includes(inputExt)) {
    return NextResponse.json({ error: `Unsupported input file type for PDF conversion: ${inputExt}` }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Magic number validation
  if (!isMagicValid(inputExt, buffer)) {
    return NextResponse.json({ error: "File content does not match its extension (magic number validation failed)." }, { status: 400 });
  }
  // Save to temp file
  const tempDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(tempDir, { recursive: true });
  const inputPath = path.join(tempDir, `input_${Date.now()}`);
  const outputPath = `${inputPath}.pdf`;
  await fs.writeFile(inputPath, buffer);
  // Use libreoffice to convert
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn("libreoffice", [
        "--headless",
        "--convert-to",
        "pdf",
        inputPath,
        "--outdir",
        tempDir,
      ]);
      proc.on("exit", (code) =>
        code === 0 ? resolve(null) : reject(new Error("LibreOffice failed")),
      );
      proc.on("error", reject);
    });
    const pdfBuffer = await fs.readFile(outputPath);
    await fs.unlink(inputPath);
    await fs.unlink(outputPath);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="converted.pdf"',
      },
    });
  } catch {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
