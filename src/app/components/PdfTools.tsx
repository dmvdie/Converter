"use client";
import React, { useRef, useState } from "react";
export default function PdfTools() {
  // Split PDF state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPage, setSplitPage] = useState<number>(1);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitDragActive, setSplitDragActive] = useState(false);
  const [splitError, setSplitError] = useState("");
  const [splitProgress, setSplitProgress] = useState(0);
  const [splitDownloadUrl, setSplitDownloadUrl] = useState<string | null>(null);
  const [splitDownloadName, setSplitDownloadName] = useState<string>("");
  const splitFormRef = useRef<HTMLFormElement>(null);

  // Merge PDF state
  const [mergeFiles, setMergeFiles] = useState<FileList | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeDragActive, setMergeDragActive] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeDownloadUrl, setMergeDownloadUrl] = useState<string | null>(null);
  const [mergeDownloadName, setMergeDownloadName] = useState<string>("");
  const mergeFormRef = useRef<HTMLFormElement>(null);

  // Handlers (stubs)
  const handleSplit = (e: React.FormEvent) => {
    e.preventDefault();
    setSplitError("");
    setSplitDownloadUrl(null);
    setSplitLoading(true);
    setSplitProgress(0);
    if (!splitFile) {
      setSplitError("Please select a PDF file.");
      setSplitLoading(false);
      return;
    }
    if (splitFile.size > 20 * 1024 * 1024) {
      setSplitError("File is too large (max 20MB).");
      setSplitLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", splitFile);
    formData.append("page", String(splitPage));
    formData.append("originalName", splitFile.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/convert/pdf/split");
    xhr.responseType = "blob";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setSplitProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setSplitLoading(false);
      setSplitProgress(0);
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        let filename = "extracted.pdf";
        const disposition = xhr.getResponseHeader("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          } else if (splitFile) {
            // fallback: use FILENAME_page_PAGENUMBER.pdf
            const originalName = splitFile.name.replace(/\.[^.]+$/, "");
            filename = `${originalName}_page${splitPage}.pdf`;
          }
        } else if (splitFile) {
          // fallback: use FILENAME_page_PAGENUMBER.pdf
          const originalName = splitFile.name.replace(/\.[^.]+$/, "");
          filename = `${originalName}_page${splitPage}.pdf`;
        }
        setSplitDownloadUrl(url);
        setSplitDownloadName(filename);
      } else {
        const errorMsg = "Failed to extract page.";
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              setSplitError(json.error || errorMsg);
            } catch {
              setSplitError(errorMsg);
            }
          };
          reader.readAsText(xhr.response);
        } catch {
          setSplitError(errorMsg);
        }
      }
    };
    xhr.onerror = () => {
      setSplitLoading(false);
      setSplitProgress(0);
      setSplitError("Network error. Please try again.");
    };
    xhr.send(formData);
  };
  const handleMerge = (e: React.FormEvent) => {
    e.preventDefault();
    setMergeError("");
    setMergeDownloadUrl(null);
    setMergeLoading(true);
    setMergeProgress(0);
    if (!mergeFiles || mergeFiles.length < 2) {
      setMergeError("Please select at least 2 PDF files.");
      setMergeLoading(false);
      return;
    }
    for (let i = 0; i < mergeFiles.length; i++) {
      if (mergeFiles[i].size > 20 * 1024 * 1024) {
        setMergeError(`File ${mergeFiles[i].name} is too large (max 20MB).`);
        setMergeLoading(false);
        return;
      }
    }
    const formData = new FormData();
        Array.from(mergeFiles).forEach((file) => {
      formData.append("files", file, file.name);
    });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/convert/pdf/merge");
    xhr.responseType = "blob";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setMergeProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setMergeLoading(false);
      setMergeProgress(0);
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        let filename = "merged.pdf";
        const disposition = xhr.getResponseHeader("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) filename = match[1];
        }
        setMergeDownloadUrl(url);
        setMergeDownloadName(filename);
      } else {
        const errorMsg = "Failed to merge PDFs.";
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              setMergeError(json.error || errorMsg);
            } catch {
              setMergeError(errorMsg);
            }
          };
          reader.readAsText(xhr.response);
        } catch {
          setMergeError(errorMsg);
        }
      }
    };
    xhr.onerror = () => {
      setMergeLoading(false);
      setMergeProgress(0);
      setMergeError("Network error. Please try again.");
    };
    xhr.send(formData);
  };

  return (
    <div className="flex flex-row gap-8 items-stretch w-full">
      {/* Split PDF Card */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 w-[360px] min-w-[360px] max-w-[360px] h-full">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-black font-semibold">Split PDF (Extract Page)</h2>
        </div>
        {/* Body */}
        <form ref={splitFormRef} onSubmit={handleSplit} encType="multipart/form-data">
          {/* Loading indicator (match ImageConverter) */}
          <div className={splitLoading ? "flex items-center gap-2 mb-2" : "hidden"}>
            <span>Extracting...</span>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-100 border-t-teal-400 rounded-full"></span>
          </div>
          {/* File input label */}
          <label htmlFor="splitFile" className="block mb-2 font-medium">Select PDF:</label>
          {/* File dropzone */}
          <div className="mb-4">
            <label
              htmlFor="splitFile"
              className={`block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 w-[312px] h-[128px] text-center transition shadow-sm bg-white flex flex-col items-center justify-center ${splitFile ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}
              onDragOver={e => { e.preventDefault(); setSplitDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setSplitDragActive(false); }}
              onDrop={e => {
                e.preventDefault();
                setSplitDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSplitFile(e.dataTransfer.files[0]);
                }
              }}
            >
              {splitFile ? (
                <>
                  <span className="block text-base font-semibold mb-1">{splitFile.name}</span>
                  <span className="block text-xs text-green-500">File selected</span>
                </>
              ) : (
                <>
                  <span className="block font-semibold text-lg text-slate-700 mb-1">Click or drag a PDF here</span>
                  <span className="block text-xs text-gray-400">PDF only (max 20MB)</span>
                </>
              )}
              <input
                type="file"
                id="splitFile"
                name="splitFile"
                accept="application/pdf"
                required
                className="hidden"
                onChange={e => setSplitFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {/* Page number input (unique to Split PDF) */}
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="splitPage" className="font-medium mb-0 whitespace-nowrap">Page number:</label>
            <input
              id="splitPage"
              type="number"
              min={1}
              value={splitPage}
              onChange={e => setSplitPage(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20 h-[37px]"
              required
            />
          </div>
          {/* Error message */}
          {splitError && <div className="text-red-600 text-xs mb-0">{splitError}</div>}
          {/* Progress bar */}
          {splitLoading && (
            <progress value={splitProgress} max={100} className="w-full mt-2" />
          )}
          {/* Submit button */}
          <button
            type="submit"
            disabled={splitLoading}
            className="mt-6 w-full bg-[#D0E8C5] text-teal-900 rounded-md py-2 font-medium hover:bg-[#b8dcb0] transition"
          >
            Extract Page
          </button>
          {/* Download link */}
          {splitDownloadUrl && (
            <a
              href={splitDownloadUrl}
              download={splitDownloadName}
              className="download-link block mt-4 bg-[#D0E8C5] text-teal-900 text-center py-2 rounded-md font-medium hover:bg-[#b8dcb0] transition"
            >
              ⬇️ Download Extracted Page
            </a>
          )}
        </form>
      </div>
      {/* Merge PDFs Card */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 w-[360px] min-w-[360px] max-w-[360px] h-full">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-black font-semibold">Merge PDFs</h2>
        </div>
        {/* Body */}
        <form ref={mergeFormRef} onSubmit={handleMerge} encType="multipart/form-data">
          {/* Loading indicator (match ImageConverter) */}
          <div className={mergeLoading ? "flex items-center gap-2 mb-2" : "hidden"}>
            <span>Merging...</span>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-100 border-t-teal-400 rounded-full"></span>
          </div>
          {/* File input label */}
          <label htmlFor="mergeFiles" className="block mb-2 font-medium">Select PDF files:</label>
          {/* File dropzone */}
          <div className="mb-4">
            <label
              htmlFor="mergeFiles"
              className={`block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 w-[312px] h-[128px] text-center transition shadow-sm bg-white flex flex-col items-center justify-center ${mergeFiles && mergeFiles.length >= 2 ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}
              onDragOver={e => { e.preventDefault(); setMergeDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setMergeDragActive(false); }}
              onDrop={e => {
                e.preventDefault();
                setMergeDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setMergeFiles(e.dataTransfer.files);
                }
              }}
            >
              {mergeFiles && mergeFiles.length > 0 ? (
                <>
                  <span className="block text-base font-semibold mb-1">{Array.from(mergeFiles).map(f => f.name).join(", ")}</span>
                  <span className="block text-xs text-green-500">{mergeFiles.length} file(s) selected</span>
                </>
              ) : (
                <>
                  <span className="block font-semibold text-lg text-slate-700 mb-1">Click or drag PDFs here</span>
                  <span className="block text-xs text-gray-400">PDF only, select at least 2 (max 20MB each)</span>
                </>
              )}
              <input
                type="file"
                id="mergeFiles"
                name="mergeFiles"
                accept="application/pdf"
                multiple
                required
                className="hidden"
                onChange={e => setMergeFiles(e.target.files)}
              />
            </label>
            <div className="pb-[53px]"></div>
          </div>
          {/* Error message */}
          {mergeError && <div className="text-red-600 text-xs mb-0">{mergeError}</div>}
          {/* Progress bar */}
          {mergeLoading && (
            <progress value={mergeProgress} max={100} className="w-full mt-2" />
          )}
          {/* Submit button */}
          <button
            type="submit"
            disabled={mergeLoading}
            className="mt-6 w-full bg-[#D0E8C5] text-teal-900 rounded-md py-2 font-medium hover:bg-[#b8dcb0] transition"
          >
            Merge PDFs
          </button>
          {/* Download link */}
          {mergeDownloadUrl && (
            <a
              href={mergeDownloadUrl}
              download={mergeDownloadName}
              className="download-link block mt-4 bg-[#D0E8C5] text-teal-900 text-center py-2 rounded-md font-medium hover:bg-[#b8dcb0] transition"
            >
              ⬇️ Download merged PDF
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
