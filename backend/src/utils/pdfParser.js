import pdfParse from 'pdf-parse';

/**
 * Extract text content from PDF buffer
 */
export const extractPDFText = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

