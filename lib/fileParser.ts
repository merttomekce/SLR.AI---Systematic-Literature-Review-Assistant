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
        // Attempt to generically map columns using Regex for maximum flexibility
        const getValByRegex = (patterns: RegExp[]) => {
            for (const k of Object.keys(row)) {
                const header = k.toLowerCase().trim();
                for (const pattern of patterns) {
                    if (pattern.test(header)) {
                        return String(row[k]);
                    }
                }
            }
            return undefined;
        };

        const title = getValByRegex([/title/, /name/]) || 'Untitled Paper';
        const doi = getValByRegex([/doi/, /digital object identifier/]) || '';

        return {
            id: doi || crypto.randomUUID(), // Priority to DOI as ID, else uuid
            title,
            author: getValByRegex([/author/, /creator/]),
            year: getValByRegex([/year/, /date/, /published/]),
            abstract: getValByRegex([/abstract/, /abstract note/, /summary/, /description/, /synopsis/]),
            doi,
            journal: getValByRegex([/journal/, /publication/, /source/, /venue/]),
            url: getValByRegex([/url/, /link/]),
            issn: getValByRegex([/issn/]),
            itemType: getValByRegex([/type/]),
        };
    });
}

/**
 * Parses raw text containing APA-formatted references (or similar).
 * Attempts to extract DOIs and Years automatically.
 */
export function parseTextReferences(text: string): Paper[] {
    if (!text.trim()) return [];

    // Split by double line breaks or single line breaks if they look like separate references
    // A simple heuristic is splitting by newlines, then filtering out empty lines.
    const rawRefs = text.split(/\n\s*\n/).filter(r => r.trim().length > 0);

    // If it's just one big block, maybe split by newline if we find multiple DOIs
    // Let's stick to a simple block split for now. If no double newlines, try single newlines.
    const refs = rawRefs.length > 1 ? rawRefs : text.split('\n').filter(r => r.trim().length > 10);

    return refs.map((ref) => {
        const cleanRef = ref.trim();

        // Extract Year: looks for (YYYY)
        const yearMatch = cleanRef.match(/\((19|20)\d{2}\)/);
        const year = yearMatch ? yearMatch[0].replace(/[\(\)]/g, '') : undefined;

        // Extract DOI: looks for doi.org/... or doi: ...
        const doiMatch = cleanRef.match(/(?:https?:\/\/doi\.org\/|doi:\s*)(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
        const doi = doiMatch ? doiMatch[1] : undefined;

        // Title: fallback to the first 100 characters of the reference
        const titleMatch = cleanRef.match(/\)\.\s*(.*?)(?:\.|$)/);
        const title = titleMatch ? titleMatch[1].trim() : cleanRef.substring(0, 100) + '...';

        return {
            id: doi || crypto.randomUUID(),
            title,
            year,
            doi,
            abstract: cleanRef, // Store the full reference here for the LLM
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
