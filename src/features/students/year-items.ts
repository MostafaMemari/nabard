import { toPersianDigits } from "@/lib/format";
import { TKD_BANK_CHARGE_YEAR_MAX, TKD_BANK_CHARGE_YEAR_MIN } from "./schemas";

// Jalali year options for the federation bank charge select (1380..1406).
export const tkdBankChargeYearItems = Object.fromEntries(
  Array.from({ length: TKD_BANK_CHARGE_YEAR_MAX - TKD_BANK_CHARGE_YEAR_MIN + 1 }, (_, index) => [
    String(TKD_BANK_CHARGE_YEAR_MIN + index),
    toPersianDigits(TKD_BANK_CHARGE_YEAR_MIN + index),
  ]),
);
