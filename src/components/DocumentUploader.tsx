"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { extractTextFromDocument } from "@/utils/documentUtils";
import { Upload, FileText, X, AlertCircle, FileUp } from "lucide-react";

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

  // Automatically process the file when it's selected
  useEffect(() => {
    if (selectedFile && !isProcessing) {
      extractTextFromFile();
    }
  }, [selectedFile]);

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
      <h2 className="text-xl font-semibold mb-4 flex items-center text-primary-800">
        <FileUp className="w-5 h-5 mr-2 text-primary-600" />
        Upload Documents
      </h2>

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
          <Upload className="w-10 h-10 text-primary-400 mb-3" />

          {isDragActive ? (
            <p className="text-primary-600 font-medium">
              Drop your file here...
            </p>
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
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 flex items-start border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{fileError}</p>
        </div>
      )}

      {selectedFile && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="bg-primary-50 p-2 rounded-lg">
              <FileText className="w-8 h-8 text-primary-500" />
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setExtractedText("");
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-primary-100">
          <p className="text-sm font-medium text-primary-700 mb-2">
            Extracting text... {extractionProgress}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${extractionProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          Documents are automatically processed when uploaded
        </p>
      </div>
    </div>
  );
}
