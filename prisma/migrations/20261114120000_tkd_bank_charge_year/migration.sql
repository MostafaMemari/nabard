-- The federation database charge is a Jalali year (e.g. 1380..1406), not a
-- gregorian date. Replace the date column with the year and backfill it from
-- the stored dates (Nowruz ≈ March 21).
ALTER TABLE "students" ADD COLUMN "tkd_bank_charge_year" INTEGER;

UPDATE "students"
SET "tkd_bank_charge_year" = CASE
  WHEN EXTRACT(MONTH FROM "tkd_bank_charge_date") > 3
    OR (EXTRACT(MONTH FROM "tkd_bank_charge_date") = 3 AND EXTRACT(DAY FROM "tkd_bank_charge_date") >= 21)
    THEN EXTRACT(YEAR FROM "tkd_bank_charge_date")::int - 621
  ELSE EXTRACT(YEAR FROM "tkd_bank_charge_date")::int - 622
END
WHERE "tkd_bank_charge_date" IS NOT NULL;

ALTER TABLE "students" DROP COLUMN "tkd_bank_charge_date";
