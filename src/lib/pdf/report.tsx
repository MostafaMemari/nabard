import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { toPersianDigits } from "@/lib/format";
import { VAZIRMATN_BOLD_DATA_URI, VAZIRMATN_REGULAR_DATA_URI } from "./vazirmatn-fonts";

export type PdfCell = string | number | null;

export type PdfTableColumn = { header: string; width?: number; align?: "start" | "center" };

export type PdfTable = { columns: PdfTableColumn[]; rows: PdfCell[][] };

export type PdfSection = {
  heading?: string;
  meta?: Array<[string, string]>;
  paragraphs?: string[];
  table?: PdfTable;
};

export type ReportPdfInput = {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  footerNote?: string;
};

let fontsReady = false;

function ensureFonts(): void {
  if (fontsReady) return;
  Font.register({
    family: "Vazirmatn",
    fonts: [{ src: VAZIRMATN_REGULAR_DATA_URI }, { src: VAZIRMATN_BOLD_DATA_URI, fontWeight: 700 }],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

const styles = StyleSheet.create({
  page: {
    paddingVertical: 36,
    paddingHorizontal: 34,
    fontFamily: "Vazirmatn",
    fontSize: 9.5,
    color: "#111827",
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 10.5,
    color: "#4b5563",
    textAlign: "right",
    marginTop: 3,
  },
  heading: {
    fontSize: 11.5,
    fontWeight: 700,
    textAlign: "right",
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.7,
    borderBottomColor: "#d1d5db",
  },
  metaRow: {
    flexDirection: "row-reverse",
    marginTop: 2,
  },
  metaLabel: {
    color: "#6b7280",
    textAlign: "right",
  },
  metaValue: {
    textAlign: "right",
    marginStart: 4,
  },
  paragraph: {
    textAlign: "right",
    lineHeight: 1.7,
    marginTop: 2,
  },
  table: {
    borderWidth: 0.7,
    borderColor: "#d1d5db",
    marginTop: 4,
  },
  row: {
    flexDirection: "row-reverse",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row-reverse",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 0.7,
    borderBottomColor: "#d1d5db",
  },
  cell: {
    padding: 4.5,
    lineHeight: 1.5,
  },
  headerCell: {
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 34,
    right: 34,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
});

function TableView({ table }: { table: PdfTable }) {
  const total = table.columns.reduce((sum, column) => sum + (column.width ?? 1), 0);

  return (
    <View style={styles.table} wrap={false}>
      <View style={styles.headerRow} fixed>
        {table.columns.map((column, index) => (
          <View
            key={`column-${column.header}-${index}`}
            style={[styles.cell, styles.headerCell, { flexBasis: `${((column.width ?? 1) / total) * 100}%` }]}
          >
            <Text style={{ textAlign: "right" }}>{column.header}</Text>
          </View>
        ))}
      </View>
      {table.rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { backgroundColor: rowIndex % 2 === 1 ? "#f9fafb" : "white" }]}>
          {row.map((value, columnIndex) => (
            <View
              key={`cell-${rowIndex}-${columnIndex}`}
              style={[
                styles.cell,
                {
                  flexBasis: `${((table.columns[columnIndex]?.width ?? 1) / total) * 100}%`,
                },
              ]}
            >
              <Text style={{ textAlign: table.columns[columnIndex]?.align === "center" ? "center" : "right" }}>
                {value === null ? "—" : String(value)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export async function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  ensureFonts();

  const doc = (
    <Document title={input.title} language="fa" subject={input.subtitle ?? input.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{input.title}</Text>
        {input.subtitle ? <Text style={styles.subtitle}>{input.subtitle}</Text> : null}
        {input.sections.map((section, index) => (
          <View key={`section-${index}`}>
            {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
            {section.meta?.map(([label, value]) => (
              <View key={label} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{label}:</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <Text key={`paragraph-${paragraphIndex}`} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.table ? <TableView table={section.table} /> : null}
          </View>
        ))}
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${input.footerNote ? `${input.footerNote} — ` : ""}صفحهٔ ${toPersianDigits(pageNumber)} از ${toPersianDigits(totalPages)}`
          }
        />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
