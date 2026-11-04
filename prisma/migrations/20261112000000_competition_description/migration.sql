-- Optional competition description: the province admin writes a note for
-- coaches (e.g. venue details, rules); coaches see it on the competition page.
ALTER TABLE "competitions" ADD COLUMN "description" VARCHAR(2000);
