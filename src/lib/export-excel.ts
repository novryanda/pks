"use client";

import * as XLSX from "xlsx";

export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param columns Column definitions
 * @param filename Filename without extension
 * @param sheetName Sheet name (default: "Data")
 */
export function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn[],
    filename: string,
    sheetName: string = "Data"
): void {
    // Prepare header row
    const headers = columns.map((col) => col.header);

    // Prepare data rows
    const rows = data.map((item) =>
        columns.map((col) => {
            const value = getNestedValue(item, col.key);
            return value !== undefined && value !== null ? value : "";
        })
    );

    // Create worksheet data with headers
    const worksheetData = [headers, ...rows];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = columns.map((col) => ({
        wch: col.width || Math.max(col.header.length, 15),
    }));
    ws["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(workbook, fullFilename);
}

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue(obj, "category.name") => obj.category.name
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        if (typeof current === "object") {
            current = (current as Record<string, unknown>)[key];
        } else {
            return undefined;
        }
    }

    return current;
}

/**
 * Format number for Excel
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Format date for Excel
 */
export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    } catch {
        return dateString;
    }
}
