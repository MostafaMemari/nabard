-- Student profile: the declared weight moves out of the profile (it is entered
-- per registration for Kyorugi from now on) and the sports insurance date and
-- the Taekwondo information bank charge date are added.
ALTER TABLE "students" DROP COLUMN IF EXISTS "weight_kg";

ALTER TABLE "students" ADD COLUMN "insurance_date" DATE;
ALTER TABLE "students" ADD COLUMN "tkd_bank_charge_date" DATE;
