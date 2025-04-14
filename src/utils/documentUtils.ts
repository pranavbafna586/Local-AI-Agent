import Tesseract from 'tesseract.js'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { extractTextFromPDF } from './pdfUtils'

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
    let extractedText = ''
    
    // Handle different file types
    if (file.type.includes('image')) {
      try {
        // Image processing with Tesseract OCR
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text' && onProgress) {
                onProgress(Math.round(m.progress * 100))
              }
            }
          }
        )
        extractedText = result.data.text
      } catch (imageError) {
        console.error('Error processing image with OCR:', imageError)
        throw new Error('Failed to extract text from the image. Please try with a clearer image.')
      }
    } 
    else if (file.type === 'application/pdf') {
      try {
        // PDF processing
        const fileData = await readFileAsArrayBuffer(file)
        extractedText = await extractTextFromPDF(fileData)
        
        if (onProgress) {
          onProgress(100)
        }
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError)
        throw new Error('Failed to extract text from the PDF document. The file might be encrypted or damaged.')
      }
    } 
    else if (file.type.includes('wordprocessingml.document')) {
      try {
        // Word document processing
        const fileData = await readFileAsArrayBuffer(file)
        const result = await mammoth.extractRawText({ arrayBuffer: fileData })
        extractedText = result.value
        
        if (onProgress) {
          onProgress(100)
        }
      } catch (wordError) {
        console.error('Error processing Word document:', wordError)
        throw new Error('Failed to extract text from the Word document. The file might be damaged.')
      }
    } 
    else if (file.type.includes('spreadsheetml.sheet')) {
      try {
        // Excel processing
        const fileData = await readFileAsArrayBuffer(file)
        const workbook = XLSX.read(fileData, { type: 'array' })
        
        // Extract text from all sheets
        extractedText = workbook.SheetNames.map(sheetName => {
          const sheet = workbook.Sheets[sheetName]
          return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`
        }).join('\n\n')
        
        if (onProgress) {
          onProgress(100)
        }
      } catch (excelError) {
        console.error('Error processing Excel file:', excelError)
        throw new Error('Failed to extract text from the Excel file. The file might be damaged.')
      }
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
    
    return extractedText || 'No text could be extracted from the document.'
  } catch (error) {
    console.error('Error extracting text from document:', error)
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to extract text from ${file.name}`)
  }
}

/**
 * Read file as ArrayBuffer
 * @param file - The file to read
 * @returns Promise with ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}