import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export async function convertToPdf(
  inputPath: string,
  outputDir: string,
): Promise<string> {
  const libreofficeCmd =
    process.platform === "win32" ? "soffice" : "libreoffice";
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(libreofficeCmd, [
      "--headless",
      "--convert-to",
      "pdf",
      inputPath,
      "--outdir",
      outputDir,
    ]);
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("LibreOffice failed")),
    );
    proc.on("error", reject);
  });
  const outputPath = path.join(
    outputDir,
    path.basename(inputPath, path.extname(inputPath)) + ".pdf",
  );
  if (!fs.existsSync(outputPath)) throw new Error("PDF not created");
  return outputPath;
}
