
import { promises as fs } from 'fs';
import path from 'path';

const spoolPath = path.join(process.cwd(), 'data', 'prints');

/**
 * Renders HTML content and saves it to a file.
 * In a real-world scenario, this would use a library like puppeteer to convert HTML to PDF.
 * For this local-only mock, we will save the file as HTML and rely on the browser to print/save as PDF.
 * 
 * @param html The HTML content to save.
 * @param fileName The name of the file to save (without extension).
 * @returns The path to the saved file.
 */
export async function renderAndSave(html: string, fileName: string): Promise<string> {
    await fs.mkdir(spoolPath, { recursive: true });
    const outputPath = path.join(spoolPath, `${fileName}.html`);
    await fs.writeFile(outputPath, html, 'utf-8');
    // Return a web-accessible path
    return `/data/prints/${fileName}.html`;
}
