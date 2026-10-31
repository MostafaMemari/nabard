import { format } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

export const MONEY_UNIT = "تومان";

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const numberFormatter = new Intl.NumberFormat("fa-IR");

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
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
  return toPersianDigits(format(value, "yyyy/MM/dd", { locale: faIR }));
}

export function formatJalaliDateTime(value: Date | number): string {
  return toPersianDigits(format(value, "yyyy/MM/dd HH:mm", { locale: faIR }));
}
