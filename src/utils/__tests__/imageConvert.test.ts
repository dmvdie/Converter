import { convertImage } from "../imageConvert";
import fs from "fs";
import path from "path";

describe("convertImage", () => {
  const input = fs.readFileSync(path.join(__dirname, "fixtures", "sample.png"));

  it("converts PNG to JPEG", async () => {
    const output = await convertImage(input, "jpeg");
    expect(Buffer.isBuffer(output)).toBe(true);
    // JPEG files start with 0xFFD8
    expect(output[0]).toBe(0xff);
    expect(output[1]).toBe(0xd8);
  });

  it("converts PNG to WEBP", async () => {
    const output = await convertImage(input, "webp");
    expect(Buffer.isBuffer(output)).toBe(true);
    // WEBP files start with RIFF (0x52 0x49 0x46 0x46)
    expect(output[0]).toBe(0x52);
    expect(output[1]).toBe(0x49);
    expect(output[2]).toBe(0x46);
    expect(output[3]).toBe(0x46);
  });

  it("converts PNG to TIFF", async () => {
    const output = await convertImage(input, "tiff");
    expect(Buffer.isBuffer(output)).toBe(true);
    // TIFF files start with either II*\x00 or MM\x00*
    const tiffMagic = output.slice(0, 4).toString("hex");
    expect(["49492a00", "4d4d002a"]).toContain(tiffMagic);
  });

  it("converts PNG to GIF", async () => {
    const output = await convertImage(input, "gif");
    expect(Buffer.isBuffer(output)).toBe(true);
    // GIF files start with GIF8
    expect(output.slice(0, 4).toString()).toBe("GIF8");
  });

  it("converts PNG to AVIF", async () => {
    const output = await convertImage(input, "avif");
    expect(Buffer.isBuffer(output)).toBe(true);
    // AVIF files start with ftypavif or ftypavi at byte 4
    const avifHeader = output.slice(4, 11).toString();
    expect(["ftypavif", "ftypavi"]).toContain(avifHeader);
  });

  it("converts PNG to PNG (identity)", async () => {
    const output = await convertImage(input, "png");
    expect(Buffer.isBuffer(output)).toBe(true);
    // PNG files start with 0x89 0x50 0x4E 0x47
    expect(output[0]).toBe(0x89);
    expect(output[1]).toBe(0x50);
    expect(output[2]).toBe(0x4e);
    expect(output[3]).toBe(0x47);
  });
});
