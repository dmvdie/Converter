
import { PDFDocument } from 'pdf-lib';
import { Readable } from 'stream';
import { POST } from '../../app/api/convert/pdf/split/route';

describe('PDF Split', () => {
  it('extracts a page from a generated PDF and returns the correct filename', async () => {
    // Generate two PDFs
    const pdf1 = await PDFDocument.create();
    pdf1.addPage();
    pdf1.addPage();
    // const pdf1Bytes = await pdf1.save(); // Unused, removed for lint
    const pdf2 = await PDFDocument.create();
    pdf2.addPage();
    pdf2.addPage();
    pdf2.addPage();
    const pdf2Bytes = await pdf2.save();

    // We'll extract page 2 from pdf2
    const fileName = 'myfile.pdf';
    const pageNum = 2;
    const boundary = 'test-boundary';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n'),
      Buffer.from('Content-Type: application/pdf\r\n\r\n'),
      Buffer.from(pdf2Bytes),
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="page"\r\n\r\n'),
      Buffer.from(pageNum.toString()),
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="originalName"\r\n\r\n'),
      Buffer.from(fileName),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const req = {
      headers: new Map([
        ['content-type', `multipart/form-data; boundary=${boundary}`],
        ['x-forwarded-for', 'test'],
      ]),
      body: Readable.from(body),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const contentDisposition = res.headers.get('Content-Disposition');
    expect(contentDisposition).toContain('myfile_page2.pdf');
  });
});
