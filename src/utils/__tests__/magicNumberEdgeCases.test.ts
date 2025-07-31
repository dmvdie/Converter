import { isMagicValid } from "../magicNumber";
import fs from "fs";
import path from "path";

describe("isMagicValid edge cases", () => {
  it("should return false for a PNG file with a wrong extension", () => {
    const filePath = path.join(__dirname, "fixtures", "sample.png");
    const buffer = fs.readFileSync(filePath);
    expect(isMagicValid("jpg", buffer)).toBe(false);
  });

  it("should return false for a corrupted PNG file", () => {
    const corrupted = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]);
    expect(isMagicValid("png", corrupted)).toBe(false);
  });

  it("should return false for an empty buffer", () => {
    expect(isMagicValid("png", Buffer.alloc(0))).toBe(false);
  });

  it("should return false for an unsupported extension", () => {
    const filePath = path.join(__dirname, "fixtures", "sample.png");
    const buffer = fs.readFileSync(filePath);
    expect(isMagicValid("exe", buffer)).toBe(false);
  });
});
