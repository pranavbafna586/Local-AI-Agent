import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker properly with a more reliable approach
const pdfjsVersion = pdfjs.version;
const pdfjsWorker = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract text from a PDF file with enhanced error handling
 * @param fileBuffer - ArrayBuffer containing the PDF data
 * @param fileName - Optional file name for metadata
 * @param fileSize - Optional file size for metadata
 * @returns Promise with extracted text
 */
export const extractTextFromPDF = async (
  fileBuffer: ArrayBuffer,
  fileName?: string,
  fileSize?: number
): Promise<string> => {
  try {
    // Convert ArrayBuffer to Uint8Array for PDF.js
    const uint8Array = new Uint8Array(fileBuffer);

    // Load the PDF file with additional options for better compatibility
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    let extractedText = "";

    // Process all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);

        // Get text content with maximum options for extraction
        const textContent = await page.getTextContent({
          disableCombineTextItems: false,
        });

        // Process text items with better structure preservation
        let lastY = null;
        let pageText = "";

        for (const item of textContent.items) {
          if (
            !("str" in item) ||
            typeof item.str !== "string" ||
            !item.str.trim()
          ) {
            continue;
          }

          const transform = (item as any).transform;
          const currentY = transform ? transform[5] : null;

          // Add newlines for significant position changes (new paragraphs)
          if (
            lastY !== null &&
            currentY !== null &&
            Math.abs(currentY - lastY) > 5
          ) {
            pageText += "\n";
          } else if (
            pageText.length > 0 &&
            !pageText.endsWith("\n") &&
            !pageText.endsWith(" ")
          ) {
            pageText += " ";
          }

          pageText += item.str;
          lastY = currentY;
        }

        // Try to also get raw text content as a fallback
        if (!pageText.trim()) {
          try {
            const textLayer = await page.getTextContent();
            pageText = textLayer.items
              .filter((item) => "str" in item)
              .map((item) => ("str" in item ? (item.str as string) : ""))
              .join(" ");
          } catch (e) {
            console.warn("Could not get raw text content:", e);
          }
        }

        // If text is still empty, try to extract content using the render context
        if (!pageText.trim()) {
          try {
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext("2d");
            if (context) {
              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              // Note: This is just for attempting to force PDF.js to process text
              // The actual text isn't extracted from the canvas
            }
          } catch (e) {
            console.warn("Canvas render failed:", e);
          }

          // Try once more after rendering
          try {
            const textLayer = await page.getTextContent();
            pageText = textLayer.items
              .filter((item) => "str" in item)
              .map((item) => ("str" in item ? (item.str as string) : ""))
              .join(" ");
          } catch (e) {
            console.warn("Final attempt to get text content failed:", e);
          }
        }

        extractedText += `\n--- Page ${i} ---\n${pageText.trim()}\n`;
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        extractedText += `\n--- Page ${i} (Error: Could not extract text) ---\n`;
      }
    }

    const finalText = extractedText.trim();

    // If we managed to extract any text, return it
    if (finalText) {
      return finalText;
    }

    // If no text was extracted, try OCR approach (direct text extraction)
    return await extractTextDirectly(
      uint8Array,
      fileName,
      fileSize,
      pdf.numPages
    );
  } catch (error) {
    console.error("Error extracting text from PDF:", error);

    // Try direct extraction as a last resort
    try {
      return await extractTextDirectly(
        new Uint8Array(fileBuffer),
        fileName,
        fileSize
      );
    } catch (directError) {
      console.error("Direct extraction also failed:", directError);
      return `Failed to extract text from PDF "${
        fileName || "document"
      }". Please ensure the PDF contains text content and is not a scanned image without OCR.`;
    }
  }
};

/**
 * Attempt to extract text directly from PDF without using the standard content extraction
 * This is a more aggressive approach for difficult PDFs
 */
async function extractTextDirectly(
  data: Uint8Array,
  fileName?: string,
  fileSize?: number,
  numPages?: number
): Promise<string> {
  try {
    // Use a more direct approach to force text extraction
    const loadingTask = pdfjs.getDocument({
      data: data,
      disableRange: false,
      disableStream: false,
      disableAutoFetch: false,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = numPages || pdf.numPages;
    let fullText = "";

    // Process all pages in a more direct way
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getOperatorList();

        // Extract text using a different method
        const textContent = await page.getTextContent();

        let pageText = "";
        let lastY = null;

        // Process text with position awareness
        for (const item of textContent.items) {
          if (
            "str" in item &&
            typeof item.str === "string" &&
            item.str.trim()
          ) {
            const transform = (item as any).transform;
            const currentY = transform ? transform[5] : null;

            // New paragraph detection
            if (
              lastY !== null &&
              currentY !== null &&
              Math.abs(currentY - lastY) > 5
            ) {
              pageText += "\n";
            } else if (
              pageText &&
              !pageText.endsWith("\n") &&
              !pageText.endsWith(" ")
            ) {
              pageText += " ";
            }

            pageText += item.str;
            lastY = currentY;
          }
        }

        fullText += `\n--- Page ${i} ---\n${pageText.trim()}\n`;
      } catch (pageError) {
        console.warn(`Error in direct extraction for page ${i}:`, pageError);
        fullText += `\n--- Page ${i} (Error: Could not extract text) ---\n`;
      }
    }

    const finalText = fullText.trim();

    // If we got any text, return it
    if (finalText) {
      return finalText;
    }

    // If absolutely no text was found, provide a meaningful error
    return `This PDF does not contain extractable text. It may be a scanned document without OCR, an image-based PDF, or have content protection enabled.`;
  } catch (error) {
    console.error("Direct text extraction failed:", error);
    return `Unable to extract text from this PDF. If the document contains visible text when viewed in a PDF reader, it may be using custom fonts or encoding methods that are not compatible with text extraction.`;
  }
}
