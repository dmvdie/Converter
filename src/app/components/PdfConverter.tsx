"use client";
import React, { useRef, useState } from "react";

const allowedTypes = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
];

export default function PdfConverter() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fileInput = form["pdfFile"] as HTMLInputElement;
    if (!fileInput.files?.length) return alert("Please select a document.");
    const file = fileInput.files[0];
    if (file.size > 20 * 1024 * 1024)
      return alert("File is too large (max 20MB).");
    if (!allowedTypes.includes(file.type))
      return alert("Unsupported document type.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", "pdf");
    setDownloadUrl(null);
    setLoading(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/convert/pdf");
    xhr.responseType = "blob";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress((event.loaded / event.total) * 100);
      }
    };
    xhr.onload = () => {
      setLoading(false);
      setProgress(0);
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        let filename = "converted.pdf";
        const disposition = xhr.getResponseHeader("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) filename = match[1];
        }
        setDownloadUrl(url);
        setDownloadName(filename);
      } else {
        setDownloadUrl(null);
        alert("Conversion failed.");
      }
    };
    xhr.onerror = () => {
      setLoading(false);
      setProgress(0);
      alert("Network or server error.");
    };
    xhr.send(formData);
  };

  return (
    <div className="converter-box bg-white border border-gray-200 rounded-xl shadow-md p-8 flex-1 min-w-[320px] max-w-[400px]">
      <h2 className="text-black font-semibold text-lg mb-4">
        Office to PDF Converter
      </h2>
      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
        <div className={loading ? "flex items-center gap-2 mb-2" : "hidden"}>
          <span>Converting...</span>
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full"></span>
        </div>
        <label htmlFor="pdfFile" className="block mb-2 font-medium">
          Select Office document (DOCX, DOC, PPTX, XLSX):
        </label>
        <div className="mb-4">
          <label
            htmlFor="pdfFile"
            className={`block cursor-pointer border-2 border-dashed border-blue-400 rounded-lg p-6 text-center transition ${selectedFile ? "bg-green-50 border-green-400 text-green-700" : "text-blue-700 bg-blue-50 hover:bg-blue-100"}`}
          >
            {selectedFile ? (
              <>
                <span className="block text-base font-semibold mb-1">
                  {selectedFile.name}
                </span>
                <span className="block text-xs text-green-500">
                  File selected
                </span>
              </>
            ) : (
              <>
                <span className="block text-base font-semibold mb-1">
                  Click or drag a document here
                </span>
                <span className="block text-xs text-blue-500">
                  DOCX, DOC, PPTX, XLSX (max 20MB)
                </span>
              </>
            )}
            <input
              type="file"
              id="pdfFile"
              name="pdfFile"
              accept=".doc,.docx,.pptx,.xlsx"
              required
              className="hidden"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files && e.target.files[0]
                    ? e.target.files[0]
                    : null,
                )
              }
            />
          </label>
        </div>
        {loading && (
          <progress value={progress} max={100} className="w-full mt-2" />
        )}
        <button
          type="submit"
          className="mt-6 w-full bg-blue-600 text-white rounded-md py-2 font-medium text-lg hover:bg-blue-800 transition block mx-auto"
        >
          Convert to PDF
        </button>
      </form>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadName}
          className="download-link block mt-4 bg-green-500 text-white text-center py-2 rounded-md font-medium hover:bg-green-700 transition"
        >
          ⬇️ Download PDF
        </a>
      )}
    </div>
  );
}
