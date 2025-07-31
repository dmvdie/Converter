// Utility for validating magic numbers for Office and PDF files
export function isMagicValid(ext: string, buffer: Buffer): boolean {
  // PDF
  if (ext === 'pdf') return buffer.slice(0, 5).equals(Buffer.from([0x25,0x50,0x44,0x46,0x2d])); // %PDF-
  // Office
  if (["docx","xlsx","pptx"].includes(ext)) return buffer.slice(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
  if (ext === 'doc') return buffer.slice(0, 8).equals(Buffer.from([0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1]));
  if (["odt","ods","odp"].includes(ext)) return buffer.slice(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
  // Images
  if (ext === 'png') return buffer.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]));
  if (["jpg","jpeg"].includes(ext)) return buffer.slice(0, 3).equals(Buffer.from([0xFF,0xD8,0xFF]));
  if (ext === 'webp') return buffer.slice(8, 12).equals(Buffer.from([0x57,0x45,0x42,0x50])); // 'WEBP' at offset 8
  if (ext === 'gif') return buffer.slice(0, 6).equals(Buffer.from([0x47,0x49,0x46,0x38,0x39,0x61])) || buffer.slice(0, 6).equals(Buffer.from([0x47,0x49,0x46,0x38,0x37,0x61]));
  if (ext === 'bmp') return buffer.slice(0, 2).equals(Buffer.from([0x42,0x4D]));
  if (ext === 'tiff') return buffer.slice(0, 4).equals(Buffer.from([0x49,0x49,0x2A,0x00])) || buffer.slice(0, 4).equals(Buffer.from([0x4D,0x4D,0x00,0x2A]));
  return false;
}
