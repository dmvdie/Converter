import ImageConverter from "./components/ImageConverter";

import PdfTools from "./components/PdfTools";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9] flex flex-col items-center justify-start">
      <header className="w-full py-3 px-6 flex flex-col bg-white/80 shadow-sm border-b border-slate-200">
        <div className="flex items-center">
          <span className="text-xl font-bold tracking-tight text-slate-700">File Converter</span>
        </div>
        <span className="mt-1 text-sm text-slate-400 font-medium">Convert images and split/merge PDFs easily</span>
      </header>
      <div className="w-[1144px] mx-auto flex flex-row gap-8 items-start mt-16">
        <div className="flex flex-col items-stretch w-[360px]">
          <ImageConverter />
        </div>
        <div className="flex flex-col items-stretch w-[360px]">
          <PdfTools />
        </div>
      </div>
      <footer className="w-full text-center text-xs text-slate-300 py-6 mt-16">
        &copy; {new Date().getFullYear()} Converter. Built with Next.js & Tailwind CSS.
      </footer>
    </main>
  );
}
