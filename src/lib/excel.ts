import ExcelJS from "exceljs";

export type ExcelColumn = { header: string; width?: number; align?: "start" | "center"; numFmt?: string };

export type ExcelCell = string | number | null | { richText: Array<{ text: string }> };

export type ExcelSheetInput = {
  name: string;
  title?: string;
  meta?: Array<[string, string]>;
  columns: ExcelColumn[];
  rows: ExcelCell[][];
};

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
const BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
};

// ExcelJS turns string cells starting with "=" into formulas; keep them as
// plain text through a single-run rich text value instead.
function safeCell(value: ExcelCell): ExcelCell {
  if (typeof value === "string" && value.startsWith("=")) {
    return { richText: [{ text: value }] };
  }

  return value;
}

export async function renderWorkbookXlsx(sheets: ExcelSheetInput[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "سامانهٔ مسابقات تکواندو";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name, { views: [{ rightToLeft: true }] });

    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    };

    let rowIndex = 1;
    if (sheet.title) {
      const titleCell = worksheet.getCell(rowIndex, 1);
      titleCell.value = sheet.title;
      titleCell.font = { bold: true, size: 14 };
      rowIndex += 2;
    }

    for (const [label, value] of sheet.meta ?? []) {
      worksheet.getCell(rowIndex, 1).value = `${label}: ${value}`;
      rowIndex += 1;
    }
    if (sheet.meta && sheet.meta.length > 0) rowIndex += 1;

    const headerRowIndex = rowIndex;
    const headerRow = worksheet.getRow(headerRowIndex);
    sheet.columns.forEach((column, columnIndex) => {
      const cell = headerRow.getCell(columnIndex + 1);
      cell.value = column.header;
      cell.font = { bold: true };
      cell.fill = HEADER_FILL;
      cell.border = BORDER;
      const sheetColumn = worksheet.getColumn(columnIndex + 1);
      sheetColumn.width = column.width ?? 16;
      sheetColumn.alignment = { horizontal: column.align === "center" ? "center" : "right", vertical: "middle" };
      if (column.numFmt) sheetColumn.numFmt = column.numFmt;
    });
    headerRow.commit();

    worksheet.views = [{ rightToLeft: true, state: "frozen", ySplit: headerRowIndex }];

    sheet.rows.forEach((row, rowOffset) => {
      const dataRow = worksheet.getRow(headerRowIndex + 1 + rowOffset);
      row.forEach((value, columnIndex) => {
        const cell = dataRow.getCell(columnIndex + 1);
        cell.value = safeCell(value);
        if (rowOffset % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
        }
        cell.alignment = { horizontal: sheet.columns[columnIndex]?.align === "center" ? "center" : "right", vertical: "middle" };
      });
      dataRow.commit();
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
