import sharp from "sharp";

export async function convertImage(
  input: Buffer,
  format: string,
): Promise<Buffer> {
  return sharp(input)
    .toFormat(format as keyof sharp.FormatEnum)
    .toBuffer();
}
