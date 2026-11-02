-- Belts and age categories: from enums to editable base data (code, label, isActive).
-- Competitions freeze their rules in rules_snapshot when published; registrations
-- snapshot the resolved weight class.

-- ── Belts: label + isActive, then name -> code as text ──
ALTER TABLE "belts" ADD COLUMN "label" VARCHAR(60);
ALTER TABLE "belts" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "belts" SET "label" = CASE "name"
  WHEN 'white' THEN 'سفید'
  WHEN 'yellow' THEN 'زرد'
  WHEN 'green' THEN 'سبز'
  WHEN 'blue' THEN 'آبی'
  WHEN 'red' THEN 'قرمز'
  WHEN 'poom_1' THEN 'پوم ۱'
  WHEN 'poom_2' THEN 'پوم ۲'
  WHEN 'poom_3' THEN 'پوم ۳'
  WHEN 'poom_4' THEN 'پوم ۴'
  WHEN 'dan_1' THEN 'دان ۱'
  WHEN 'dan_2' THEN 'دان ۲'
  WHEN 'dan_3' THEN 'دان ۳'
  WHEN 'dan_4' THEN 'دان ۴'
  WHEN 'dan_5' THEN 'دان ۵'
  WHEN 'dan_6' THEN 'دان ۶'
  WHEN 'dan_7' THEN 'دان ۷'
  WHEN 'dan_8' THEN 'دان ۸'
  WHEN 'dan_9' THEN 'دان ۹'
  WHEN 'dan_10' THEN 'دان ۱۰'
END;

ALTER TABLE "belts" ALTER COLUMN "label" SET NOT NULL;
CREATE UNIQUE INDEX "belts_label_key" ON "belts"("label");

ALTER TABLE "belts" ALTER COLUMN "name" TYPE VARCHAR(60) USING "name"::text;
ALTER TABLE "belts" RENAME COLUMN "name" TO "code";
ALTER INDEX "belts_name_key" RENAME TO "belts_code_key";

-- ── Age categories: label + isActive, then name -> code as text ──
ALTER TABLE "age_categories" ADD COLUMN "label" VARCHAR(60);
ALTER TABLE "age_categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "age_categories" SET "label" = CASE "name"
  WHEN 'blossom' THEN 'شکوفه'
  WHEN 'youth' THEN 'نونهال'
  WHEN 'cadet' THEN 'نوجوان'
  WHEN 'junior' THEN 'جوان'
  WHEN 'young' THEN 'امید'
  WHEN 'senior' THEN 'بزرگسال'
  WHEN 'ultra' THEN 'پیشکسوت'
END;

ALTER TABLE "age_categories" ALTER COLUMN "label" SET NOT NULL;
CREATE UNIQUE INDEX "age_categories_label_key" ON "age_categories"("label");

ALTER TABLE "age_categories" ALTER COLUMN "name" TYPE VARCHAR(60) USING "name"::text;
ALTER TABLE "age_categories" RENAME COLUMN "name" TO "code";
ALTER INDEX "age_categories_name_key" RENAME TO "age_categories_code_key";

-- ── Weight classes: isActive ──
ALTER TABLE "weight_classes" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- ── Competitions: rules snapshot column ──
ALTER TABLE "competitions" ADD COLUMN "rules_snapshot" JSONB;

-- ── Registrations: weight class snapshot columns, backfilled from live rows ──
ALTER TABLE "registrations" ADD COLUMN "weight_class_label" VARCHAR(60);
ALTER TABLE "registrations" ADD COLUMN "weight_class_min" DECIMAL(5,3);
ALTER TABLE "registrations" ADD COLUMN "weight_class_max" DECIMAL(5,3);

UPDATE "registrations" AS r
SET "weight_class_label" = wc."label",
    "weight_class_min" = wc."min_weight_kg",
    "weight_class_max" = wc."max_weight_kg"
FROM "weight_classes" AS wc
WHERE r."weight_class_id" = wc."id";

-- ── Backfill the rules snapshot of every competition that is not a draft ──
WITH snapshot AS (
  SELECT c."id",
    jsonb_build_object(
      'ageCategory', jsonb_build_object(
        'id', ac."id",
        'code', ac."code",
        'label', ac."label",
        'startDate', ac."start_date",
        'endDate', ac."end_date"
      ),
      'minBelt', jsonb_build_object(
        'id', bmin."id",
        'code', bmin."code",
        'label', bmin."label",
        'level', bmin."level"
      ),
      'maxBelt', jsonb_build_object(
        'id', bmax."id",
        'code', bmax."code",
        'label', bmax."label",
        'level', bmax."level"
      ),
      'weightClasses', COALESCE(s."classes", '[]'::jsonb)
    ) AS "snapshot"
  FROM "competitions" c
  JOIN "age_categories" ac ON ac."id" = c."age_category_id"
  JOIN "belts" bmin ON bmin."id" = c."min_belt_id"
  JOIN "belts" bmax ON bmax."id" = c."max_belt_id"
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
        'id', wc."id",
        'label', wc."label",
        'min', wc."min_weight_kg",
        'max', wc."max_weight_kg",
        'excludeMin', wc."exclude_min",
        'excludeMax', wc."exclude_max",
        'order', wc."order"
      ) ORDER BY wc."order") AS "classes"
    FROM "weight_classes" wc
    WHERE wc."age_category_id" = c."age_category_id" AND wc."gender" = c."gender"
  ) s ON true
  WHERE c."status" <> 'draft'
)
UPDATE "competitions" c
SET "rules_snapshot" = snapshot."snapshot"
FROM snapshot
WHERE c."id" = snapshot."id";

DROP TYPE "BeltName";
DROP TYPE "AgeCategoryName";
