import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker - updated to make sure worker loads properly
const pdfjsWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract text from a PDF file
 * @param fileBuffer - ArrayBuffer containing the PDF data
 * @returns Promise with extracted text
 */
export const extractTextFromPDF = async (
  fileBuffer: ArrayBuffer
): Promise<string> => {
  try {
    // Load the PDF file
    const loadingTask = pdfjs.getDocument({ data: fileBuffer });
    const pdf = await loadingTask.promise;

    let extractedText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      extractedText += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
