import * as pdfjsLib from 'pdfjs-dist'

// Set worker source - use CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Extract text content from a PDF file
 * @param file - The PDF file to parse
 * @returns Promise<string> - The extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Extract text items and join them
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return item.str
        }
        return ''
      })
      .join(' ')

    // Add page marker for multi-page PDFs
    if (pdf.numPages > 1) {
      textParts.push(`[PAGE ${pageNum}]\n${pageText}`)
    } else {
      textParts.push(pageText)
    }
  }

  // Join pages with double newlines
  return textParts.join('\n\n')
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
