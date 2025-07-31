# Converter Next.js Project

## Overview
A modern Next.js file conversion app supporting image and PDF conversions. Built with TypeScript, Tailwind CSS, and robust backend logic for secure, reliable file handling.

## Features
- Convert images between formats (PNG, JPEG, WEBP, GIF, TIFF, BMP)
- Convert Office documents (DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS, ODP, RTF, TXT) to PDF
- Large file support (up to 25MB)
- Automatic cleanup of temporary files after conversion
- Real-time logging for conversions, errors, and cleanup
- API route-level validation for file types and formats
- Comprehensive unit tests for conversion logic

## Folder Structure
```
├── pages/api/convert/        # Next.js API routes for conversion
│   ├── image.ts              # Image conversion API
│   └── pdf.ts                # PDF conversion API
├── src/utils/                # Conversion logic and utilities
│   ├── imageConvert.ts       # Image conversion functions
│   ├── pdfConvert.ts         # PDF conversion functions
│   ├── conversionTracker.ts  # Tracks concurrent conversions
│   └── __tests__/            # Unit tests for conversion logic
├── tmp/                      # Temporary files (auto-cleaned)
├── public/                   # Static assets
├── clean.js                  # Script to clean uploads, outputs, tmp
├── next.config.js            # Next.js config
├── jest.config.js            # Jest config
└── README.md                 # Project documentation
```

## API Usage
### Image Conversion
- **Endpoint:** `POST /api/convert/image`
- **Body:** `multipart/form-data` with `file` and `format` fields
- **Supported Input Types:** png, jpg, jpeg, webp, gif, tiff, bmp
- **Supported Output Formats:** png, jpeg, webp, gif, tiff, bmp
- **Response:** Converted image file

#### Example `curl` command

```
curl -X POST http://localhost:3000/api/convert/image \
  -F "file=@/path/to/your/image.png" \
  -F "format=jpeg" \
  -o output.jpeg
```

> The API key is no longer required for this endpoint.

### PDF Conversion
- **Endpoint:** `POST /api/convert/pdf`
- **Body:** `multipart/form-data` with `file` field
- **Supported Input Types:** doc, docx, xls, xlsx, ppt, pptx, odt, ods, odp, rtf, txt
- **Response:** Converted PDF file

#### Example `curl` command

```
curl -X POST http://localhost:3000/api/convert/pdf \
  -F "file=@/path/to/your/document.docx" \
  -o output.pdf
```

> The API key is no longer required for this endpoint.

## Logging Conventions
- `[RUNNING_CONVERSIONS] <number>`: Shows active conversions
- `[IMAGE_CONVERSION] To <TYPE> <FILENAME>`: Image conversion start
- `[PDF_CONVERSION] <FILENAME>`: PDF conversion start
- `[CONVERSION_SUCCESSFUL] <FILENAME>`: Conversion success
- `[CONVERSION_ERROR] ...`: Conversion error
- `[CLEANUP] ...`: File cleanup actions

## Testing
- Run all unit tests: `npm test` or `npx jest`
- Tests are located in `src/utils/__tests__/`

## File Cleanup
- Temporary files are stored in `tmp/` and deleted after each conversion
- Run `node clean.js` or `npm run CLEAN` to manually clean all temp/output/upload folders

## Development
- Start server: `npm run dev`
- Format code: `npx prettier --write .`
- Lint code: `npx eslint .`

## Security & Reliability
- All file operations are restricted to the `tmp/` directory
- API routes validate file types and formats before processing
- Errors are logged and returned with appropriate status codes

## Customization
- Update supported file types/formats in API route files as needed
- Adjust file size limits in `next.config.js` and API route configs

## Environment Variables

- The `API_KEY` variable is no longer required for `/api/convert/image` and `/api/convert/pdf`.
- See `.env.example` for other configuration options if needed.

## Security Notes
- All uploads are validated by file extension and magic number (content signature).
- Rate limiting is enforced per IP (legacy API route only).
- Temporary files are cleaned up after each conversion.

## License
MIT

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
