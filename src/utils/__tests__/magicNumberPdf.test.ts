import { describe, it, expect } from "@jest/globals";

function isMagicValid(ext: string, buffer: Buffer) {
  if (ext === 'pdf') return buffer.slice(0, 5).equals(Buffer.from([0x25,0x50,0x44,0x46,0x2d])); // %PDF-
  if (["docx","xlsx","pptx"].includes(ext)) return buffer.slice(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
  if (ext === 'doc') return buffer.slice(0, 8).equals(Buffer.from([0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1]));
  if (["odt","ods","odp"].includes(ext)) return buffer.slice(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
  return false;
}

describe("isMagicValid (Office/PDF)", () => {
  it("accepts valid PDF signature", () => {
    const buf = Buffer.from([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34]); // %PDF-1.4
    expect(isMagicValid("pdf", buf)).toBe(true);
  });
  it("accepts valid DOCX signature", () => {
    const buf = Buffer.from([0x50,0x4b,0x03,0x04,0x14,0x00]);
    expect(isMagicValid("docx", buf)).toBe(true);
  });
  it("accepts valid DOC signature", () => {
    const buf = Buffer.from([0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1,0x00]);
    expect(isMagicValid("doc", buf)).toBe(true);
  });
  it("accepts valid ODT signature", () => {
    const buf = Buffer.from([0x50,0x4b,0x03,0x04,0x14,0x00]);
    expect(isMagicValid("odt", buf)).toBe(true);
  });
  it("rejects mismatched extension", () => {
    const buf = Buffer.from([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34]);
    expect(isMagicValid("docx", buf)).toBe(false);
  });
  it("rejects random data", () => {
    const buf = Buffer.from([1,2,3,4,5,6,7,8,9,0]);
    expect(isMagicValid("pdf", buf)).toBe(false);
  });
});