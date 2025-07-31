import { convertToPdf } from "../pdfConvert";
import fs from "fs";
import path from "path";

describe("convertToPdf", () => {
  const fixtures = path.join(__dirname, "fixtures");
  const cases = [
    { name: "DOCX", file: "sample.docx" },
    { name: "ODP", file: "sample.odp" },
    { name: "XLSX", file: "sample.xlsx" },
    { name: "PPTX", file: "sample.pptx" },
    { name: "TXT", file: "sample.txt" },
    { name: "RTF", file: "sample.rtf" },
  ];

  cases.forEach(({ name, file }) => {
    it(
      `converts a ${name} to PDF`,
      async () => {
        const inputPath = path.join(fixtures, file);
        const outputDir = fixtures;
        const outputPath = await convertToPdf(inputPath, outputDir);
        expect(fs.existsSync(outputPath)).toBe(true);
        // PDF files start with %PDF
        const pdfHeader = fs
          .readFileSync(outputPath, { encoding: "utf8", flag: "r" })
          .slice(0, 4);
        expect(pdfHeader).toBe("%PDF");
        fs.unlinkSync(outputPath); // Clean up
      },
      30000 // 30 seconds timeout
    );
  });
});
