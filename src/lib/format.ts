export const MONEY_UNIT = "تومان";

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const numberFormatter = new Intl.NumberFormat("fa-IR");

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function joinedParts(formatter: Intl.DateTimeFormat, value: Date | number, separator: string): string {
  const parts = formatter
    .formatToParts(new Date(value))
    .filter((part) => part.type !== "literal")
    .map((part) => part.value);
  const [year, month, day, hour, minute] = parts;
  const date = [year, month, day].join(separator);
  return hour === undefined ? date : `${date} ${hour}:${minute}`;
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

// Parses a decimal the user may type with Persian or Arabic digits and a
// Persian decimal separator; returns null when nothing numeric remains.
export function parseDecimalInput(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/٫/g, ".")
    .trim();
  if (normalized === "" || !/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatMoney(value: number): string {
  return `${formatNumber(value)} ${MONEY_UNIT}`;
}

export function formatRialsAsToman(value: number): string {
  return formatMoney(Math.round(value / 10));
}

export function formatJalaliDate(value: Date | number): string {
  return joinedParts(dateFormatter, value, "/");
}

const jalaliYearFormatter = new Intl.DateTimeFormat("en-US", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  year: "numeric",
});

export function jalaliYear(value: Date | number): number {
  const year = jalaliYearFormatter.formatToParts(new Date(value)).find((part) => part.type === "year")?.value ?? "";
  return Number(year.replace(/\D/g, ""));
}

export function formatJalaliDateTime(value: Date | number): string {
  return joinedParts(dateTimeFormatter, value, "/");
}

export function formatCardNumber(cardNumber: string): string {
  return toPersianDigits(cardNumber.replace(/(\d{4})(?=\d)/g, "$1-"));
}
