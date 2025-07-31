import ImageConverter from "./components/ImageConverter";
import PdfConverter from "./components/PdfConverter";
import PdfTools from "./components/PdfTools";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-tr from-slate-50 to-blue-100">
      <header className="main-header bg-blue-600 text-white shadow-md">
        <div className="header-content max-w-3xl mx-auto py-4 px-6 flex items-center">
          <span className="header-logo text-2xl font-bold flex items-center gap-2">
            🖼️📄 Converter
          </span>
        </div>
      </header>
      <div className="container-flex flex flex-col md:flex-row gap-10 justify-center items-start max-w-3xl mx-auto mt-10">
        <ImageConverter />
        <PdfConverter />
      </div>
      <div className="max-w-3xl mx-auto mt-10">
        <PdfTools />
      </div>
    </main>
  );
}
