"use client";
import React, { useRef, useState } from "react";

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/tiff",
  "image/gif",
  "image/avif",
];

export default function ImageConverter() {
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
    const fileInput = form["imageFile"] as HTMLInputElement;
    const formatInput = form["imageFormat"] as HTMLSelectElement;
    if (!fileInput.files?.length) return alert("Please select an image.");
    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024)
      return alert("File is too large (max 10MB).");
    if (!allowedTypes.includes(file.type))
      return alert("Unsupported file type.");
      const formData = new FormData();
      formData.append("file", file, file.name);
    formData.append("format", formatInput.value);
    setDownloadUrl(null);
    setLoading(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/convert/image");
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
        let filename = `converted.${formatInput.value}`;
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
        Image Converter
      </h2>
      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
        <div className={loading ? "flex items-center gap-2 mb-2" : "hidden"}>
          <span>Converting...</span>
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full"></span>
        </div>
        <label htmlFor="imageFile" className="block mb-2 font-medium">
          Select image:
        </label>
        <div className="mb-4">
          <label
            htmlFor="imageFile"
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
                  Click or drag an image here
                </span>
                <span className="block text-xs text-blue-500">
                  PNG, JPEG, WEBP, TIFF, GIF, AVIF (max 10MB)
                </span>
              </>
            )}
            <input
              type="file"
              id="imageFile"
              name="imageFile"
              accept="image/*"
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
        <label htmlFor="imageFormat" className="block mb-2 font-medium">
          Convert to:
        </label>
        <div className="relative mb-4">
          <select
            id="imageFormat"
            name="imageFormat"
            required
            defaultValue="png"
            className="block w-full appearance-none bg-white border border-blue-300 rounded-md py-2 px-3 pr-8 text-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
            <option value="tiff">TIFF</option>
            <option value="gif">GIF</option>
            <option value="avif">AVIF</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
            ▼
          </span>
        </div>
        {loading && (
          <progress value={progress} max={100} className="w-full mt-2" />
        )}
        <button
          type="submit"
          className="mt-6 w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-800 transition"
        >
          Convert Image
        </button>
      </form>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadName}
          className="download-link block mt-4 bg-green-500 text-white text-center py-2 rounded-md font-medium hover:bg-green-700 transition"
        >
          ⬇️ Download Converted Image
        </a>
      )}
    </div>
  );
}
