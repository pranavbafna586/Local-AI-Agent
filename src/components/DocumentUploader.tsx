"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { extractTextFromDocument } from "@/utils/documentUtils";

interface DocumentUploaderProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

export default function DocumentUploader({
  selectedFile,
  setSelectedFile,
  setExtractedText,
  isProcessing,
  setIsProcessing,
}: DocumentUploaderProps) {
  const [fileError, setFileError] = useState<string>("");
  const [extractionProgress, setExtractionProgress] = useState<number>(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFileError("");
      const file = acceptedFiles[0];

      if (!file) return;

      // Check file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/tiff",
      ];

      if (!validTypes.includes(file.type)) {
        setFileError(
          "Invalid file type. Please upload a PDF, Word document, Excel spreadsheet, or image."
        );
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File is too large. Maximum size is 10MB.");
        return;
      }

      setSelectedFile(file);
    },
    [setSelectedFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff", ".tif"],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
  });

  const extractTextFromFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setExtractionProgress(0);
    setFileError("");

    try {
      // Use our utility function to extract text from the document
      const extractedText = await extractTextFromDocument(
        selectedFile,
        (progress) => setExtractionProgress(progress)
      );

      if (!extractedText || extractedText.trim() === "") {
        throw new Error("No text could be extracted from the document");
      }

      setExtractedText(extractedText);
      setExtractionProgress(100);
    } catch (error) {
      console.error("Error extracting text:", error);
      setExtractionProgress(0);
      if (error instanceof Error) {
        setFileError(
          error.message || "An error occurred while processing your file."
        );
      } else {
        setFileError("An error occurred while processing your file.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400"
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <svg
            className="w-10 h-10 text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {isDragActive ? (
            <p className="text-primary-600">Drop your file here...</p>
          ) : (
            <>
              <p className="text-gray-700">
                Drag & drop your file here, or{" "}
                <span className="text-primary-600 font-medium">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF, Word, Excel, and images
              </p>
            </>
          )}
        </div>
      </div>

      {fileError && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
          {fileError}
        </div>
      )}

      {selectedFile && (
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-gray-100 p-2 rounded">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Extracting text... {extractionProgress}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${extractionProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={extractTextFromFile}
          disabled={!selectedFile || isProcessing}
          className={`w-full ${
            !selectedFile || isProcessing
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "btn-primary"
          }`}
        >
          {isProcessing ? "Processing..." : "Process Document"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Upload your document and process it to start asking questions
        </p>
      </div>
    </div>
  );
}
