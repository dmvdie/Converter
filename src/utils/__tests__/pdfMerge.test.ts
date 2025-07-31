import { PDFDocument } from 'pdf-lib';
import { Readable } from 'stream';
import { POST } from '../../app/api/convert/pdf/merge/route';

describe('PDF Merge', () => {
  it('merges two generated PDFs and returns a valid merged PDF', async () => {
    // Generate two PDFs
    const pdf1 = await PDFDocument.create();
    pdf1.addPage();
    pdf1.addPage();
    const pdf1Bytes = await pdf1.save();
    const pdf2 = await PDFDocument.create();
    pdf2.addPage();
    pdf2.addPage();
    pdf2.addPage();
    const pdf2Bytes = await pdf2.save();

    // Prepare multipart body
    const boundary = 'test-boundary';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="file1.pdf"\r\n'),
      Buffer.from('Content-Type: application/pdf\r\n\r\n'),
      Buffer.from(pdf1Bytes),
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="file2.pdf"\r\n'),
      Buffer.from('Content-Type: application/pdf\r\n\r\n'),
      Buffer.from(pdf2Bytes),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const req = {
      headers: new Map([
        ['content-type', `multipart/form-data; boundary=${boundary}`],
        ['x-forwarded-for', 'test'],
      ]),
      body: Readable.from(body),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const contentDisposition = res.headers.get('Content-Disposition');
    expect(contentDisposition).toContain('merged.pdf');
    const mergedPdfBuffer = Buffer.from(await res.arrayBuffer());
    const mergedPdf = await PDFDocument.load(mergedPdfBuffer);
    // Should have 5 pages (2 + 3)
    expect(mergedPdf.getPageCount()).toBe(5);
  });
});
