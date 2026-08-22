import pdfParse from 'pdf-parse';

export class PdfService {
  /**
   * Extracts raw text from a PDF file buffer.
   */
  public static async extractText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      if (!data || !data.text) {
        throw new Error('PDF file appears to be empty or unreadable.');
      }
      return data.text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Cleans extracted text to remove excessive spacing, blank lines,
   * and clean up encoding issues to optimize token usage in the LLM.
   */
  public static cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\r\n]+/g, '\n')       // Collapse multiple newlines to single newlines
      .replace(/[ \t]+/g, ' ')         // Collapse multiple spaces/tabs to a single space
      .split('\n')
      .map(line => line.trim())        // Trim each line
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n');
  }
}
