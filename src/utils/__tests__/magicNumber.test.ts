import { describe, it, expect } from "@jest/globals";

function isMagicValid(ext: string, buffer: Buffer) {
  if (ext === 'png') return buffer.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (ext === 'jpg' || ext === 'jpeg') return buffer.slice(0, 3).equals(Buffer.from([0xff,0xd8,0xff]));
  if (ext === 'gif') return buffer.slice(0, 3).equals(Buffer.from([0x47,0x49,0x46]));
  if (ext === 'webp') return buffer.slice(0, 4).equals(Buffer.from([0x52,0x49,0x46,0x46])) && buffer.slice(8, 12).equals(Buffer.from([0x57,0x45,0x42,0x50]));
  if (ext === 'bmp') return buffer.slice(0, 2).equals(Buffer.from([0x42,0x4d]));
  if (ext === 'tiff') return buffer.slice(0, 2).equals(Buffer.from([0x49,0x49])) || buffer.slice(0, 2).equals(Buffer.from([0x4d,0x4d]));
  return false;
}

describe("isMagicValid", () => {
  it("accepts valid PNG signature", () => {
    const buf = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3]);
    expect(isMagicValid("png", buf)).toBe(true);
  });
  it("rejects invalid PNG signature", () => {
    const buf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]);
    expect(isMagicValid("png", buf)).toBe(false);
  });
  it("accepts valid JPEG signature", () => {
    const buf = Buffer.from([0xff,0xd8,0xff,0x00,0x11]);
    expect(isMagicValid("jpg", buf)).toBe(true);
    expect(isMagicValid("jpeg", buf)).toBe(true);
  });
  it("rejects mismatched extension", () => {
    const buf = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    expect(isMagicValid("jpg", buf)).toBe(false);
  });
  it("rejects random data", () => {
    const buf = Buffer.from([1,2,3,4,5,6,7,8,9,0]);
    expect(isMagicValid("png", buf)).toBe(false);
  });
});