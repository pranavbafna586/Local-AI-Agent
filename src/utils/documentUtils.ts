import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { extractTextFromPDF } from "./pdfUtils";

/**
 * Extract text from various document types
 * @param file - The file object
 * @param onProgress - Callback function for progress updates
 * @returns Promise with extracted text
 */
export const extractTextFromDocument = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    let extractedText = "";

    // Handle different file types
    if (file.type.includes("image")) {
      try {
        // No OCR, just prepare image metadata for Groq
        if (onProgress) {
          onProgress(50); // Started processing
        }

        extractedText = `
        [IMAGE DOCUMENT]
        [Filename: ${file.name}]
        [File size: ${Math.round(file.size / 1024)} KB]
        [File type: ${file.type}]
        [Dimensions: Will be processed by Groq]
        
        This image will be sent directly to Groq for processing.
        No OCR processing will be performed locally.
        `;

        if (onProgress) {
          onProgress(100);
        }
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        throw new Error(
          "Unable to process the image. The image will be sent directly to Groq."
        );
      }
    } else if (file.type === "application/pdf") {
      try {
        // Send progress update for PDF processing
        if (onProgress) {
          onProgress(10); // Started processing
        }

        // PDF processing
        const fileData = await readFileAsArrayBuffer(file);

        if (onProgress) {
          onProgress(30); // File read complete
        }

        try {
          // Pass file metadata to the PDF extraction function for better error handling
          extractedText = await extractTextFromPDF(
            fileData,
            file.name,
            file.size
          );

          if (onProgress) {
            onProgress(100);
          }
        } catch (pdfError) {
          console.error("Error processing PDF:", pdfError);
          throw new Error(
            "Failed to extract text from the PDF. The file will be sent directly to Groq."
          );
        }
      } catch (pdfError) {
        console.error("Error processing PDF:", pdfError);
        throw new Error(
          "Failed to extract text from the PDF document. The file will be sent directly to Groq."
        );
      }
    } else if (file.type.includes("wordprocessingml.document")) {
      try {
        // Word document processing
        const fileData = await readFileAsArrayBuffer(file);
        const result = await mammoth.extractRawText({ arrayBuffer: fileData });
        extractedText = result.value;

        if (onProgress) {
          onProgress(100);
        }
      } catch (wordError) {
        console.error("Error processing Word document:", wordError);
        throw new Error(
          "Failed to extract text from the Word document. The file might be damaged."
        );
      }
    } else if (file.type.includes("spreadsheetml.sheet")) {
      try {
        // Excel processing
        const fileData = await readFileAsArrayBuffer(file);
        const workbook = XLSX.read(fileData, { type: "array" });

        // Extract text from all sheets
        extractedText = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
        }).join("\n\n");

        if (onProgress) {
          onProgress(100);
        }
      } catch (excelError) {
        console.error("Error processing Excel file:", excelError);
        throw new Error(
          "Failed to extract text from the Excel file. The file might be damaged."
        );
      }
    } else {
      // For unsupported file types, send metadata to Groq
      extractedText = `
      [UNSUPPORTED DOCUMENT TYPE]
      [Filename: ${file.name}]
      [File size: ${Math.round(file.size / 1024)} KB]
      [File type: ${file.type}]
      
      This document type is not directly supported for text extraction.
      The document will be sent to Groq for processing.
      `;

      if (onProgress) {
        onProgress(100);
      }
    }

    return extractedText || "No text could be extracted from the document.";
  } catch (error) {
    console.error("Error extracting text from document:", error);
    // Return metadata even on error so Groq can still process
    return `
    [DOCUMENT PROCESSING ERROR]
    [Filename: ${file.name}]
    [File size: ${Math.round(file.size / 1024)} KB]
    [File type: ${file.type}]
    [Error: ${error instanceof Error ? error.message : "Unknown error"}]
    
    This document encountered an error during processing.
    The document will be sent directly to Groq.
    `;
  }
};

/**
 * Read file as ArrayBuffer
 * @param file - The file to read
 * @returns Promise with ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};
