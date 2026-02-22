import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
// Hardcoded worker path, should be hosted in public for production but for dev we use unpkg or local node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import { Paper } from '@/store/useReviewStore';

/**
 * Parses an Excel file and extracts papers.
 */
export async function parseExcelFile(file: File): Promise<Paper[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON array of objects
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];

    return rawData.map(row => {
        // Attempt to generically map columns (case-insensitive)
        const getVal = (possibleKeys: string[]) => {
            for (const k of Object.keys(row)) {
                if (possibleKeys.includes(k.toLowerCase().trim())) {
                    return String(row[k]);
                }
            }
            return undefined;
        };

        const title = getVal(['title', 'article title', 'name']) || 'Untitled Paper';
        const doi = getVal(['doi', 'digital object identifier']) || '';

        return {
            id: doi || crypto.randomUUID(), // Priority to DOI as ID, else uuid
            title,
            author: getVal(['author', 'authors', 'creator']),
            year: getVal(['year', 'publication year', 'date']),
            abstract: getVal(['abstract', 'summary']),
            doi,
            journal: getVal(['journal', 'publication', 'source']),
            url: getVal(['url', 'link']),
            issn: getVal(['issn']),
            itemType: getVal(['item type', 'type', 'document type']),
        };
    });
}

/**
 * Extracts text from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
    const pdfDoc = await loadingTask.promise;

    let fullText = '';
    const numPages = pdfDoc.numPages;

    // Extract text from up to first 50 pages to prevent huge payloads, though some SLRs might need all.
    for (let i = 1; i <= Math.min(numPages, 50); i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str);
        fullText += pageStrings.join(' ') + '\n';
    }

    return fullText;
}

/**
 * Utility to match PDF files to papers efficiently.
 * Expected file naming: DOI (slashes and dots replaced by underscore) or similar to title.
 */
export function matchFileToPaper(filename: string, papers: Paper[]): Paper | null {
    const cleanName = filename.toLowerCase().replace('.pdf', '');

    // Try DOI match
    for (const paper of papers) {
        if (paper.doi) {
            const escapedDoi = paper.doi.toLowerCase().replace(/[\/\.]/g, '_');
            if (cleanName.includes(escapedDoi)) {
                return paper;
            }
        }
    }

    // Try Title match (first 20 chars alphanumeric)
    for (const paper of papers) {
        if (paper.title) {
            const safeTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeFile = cleanName.replace(/[^a-z0-9]/g, '');
            if (safeTitle.length > 10 && safeFile.includes(safeTitle.substring(0, 20))) {
                return paper;
            }
        }
    }

    return null;
}

/**
 * Export Paper data to Excel
 */
export function exportToExcel(sheets: { name: string, data: any[] }[], filename: string) {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    XLSX.writeFile(workbook, filename);
}
