-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'coach');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('tehran', 'isfahan', 'fars', 'razavi_khorasan', 'khuzestan', 'east_azerbaijan', 'west_azerbaijan', 'mazandaran', 'gilan', 'kerman', 'sistan_and_baluchestan', 'golestan', 'ardabil', 'qom', 'markazi', 'hormozgan', 'kermanshah', 'alborz', 'lorestan', 'hamadan', 'yazd', 'kohgiluyeh_and_boyer_ahmad', 'chaharmahal_and_bakhtiari', 'north_khorasan', 'south_khorasan', 'ilam', 'bushehr', 'zanjan', 'qazvin', 'semnan', 'kurdistan');

-- CreateEnum
CREATE TYPE "BeltName" AS ENUM ('white', 'yellow', 'green', 'blue', 'red', 'poom_1', 'poom_2', 'poom_3', 'poom_4', 'dan_1', 'dan_2', 'dan_3', 'dan_4', 'dan_5', 'dan_6', 'dan_7', 'dan_8', 'dan_9', 'dan_10');

-- CreateEnum
CREATE TYPE "RankType" AS ENUM ('color', 'poom', 'dan');

-- CreateEnum
CREATE TYPE "AgeCategoryName" AS ENUM ('blossom', 'youth', 'cadet', 'junior', 'young', 'senior', 'ultra');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('kyorugi', 'poomsae');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('draft', 'published', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "mobile" VARCHAR(11) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(80) NOT NULL,
    "national_code" VARCHAR(10),
    "role" "Role" NOT NULL,
    "province" "Province" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "full_name" VARCHAR(80) NOT NULL,
    "gender" "Gender" NOT NULL,
    "national_code" VARCHAR(10) NOT NULL,
    "birth_date" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "belt_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belts" (
    "id" TEXT NOT NULL,
    "name" "BeltName" NOT NULL,
    "level" INTEGER NOT NULL,
    "order" INTEGER,
    "rank_type" "RankType" NOT NULL DEFAULT 'color',
    "color" TEXT,
    "color_hex" TEXT,

    CONSTRAINT "belts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_categories" (
    "id" TEXT NOT NULL,
    "name" "AgeCategoryName" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "birth_year_start" INTEGER,
    "birth_year_end" INTEGER,

    CONSTRAINT "age_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_classes" (
    "id" TEXT NOT NULL,
    "age_category_id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "label" TEXT NOT NULL,
    "min_weight_kg" DECIMAL(5,3) NOT NULL,
    "max_weight_kg" DECIMAL(5,3),
    "order" INTEGER NOT NULL,
    "exclude_min" BOOLEAN NOT NULL DEFAULT false,
    "exclude_max" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "weight_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "province" "Province" NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "gender" "Gender" NOT NULL,
    "age_category_id" TEXT NOT NULL,
    "min_belt_id" TEXT NOT NULL,
    "max_belt_id" TEXT NOT NULL,
    "fee_per_student" BIGINT NOT NULL,
    "payee_card_number" VARCHAR(16) NOT NULL,
    "payee_card_holder" VARCHAR(80) NOT NULL,
    "registration_deadline" TIMESTAMP(3) NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "receipt_key" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "weight_class_id" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "users_national_code_key" ON "users"("national_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_national_code_key" ON "students"("national_code");

-- CreateIndex
CREATE INDEX "students_coach_id_idx" ON "students"("coach_id");

-- CreateIndex
CREATE UNIQUE INDEX "belts_name_key" ON "belts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "age_categories_name_key" ON "age_categories"("name");

-- CreateIndex
CREATE INDEX "weight_class_category_gender_order" ON "weight_classes"("age_category_id", "gender", "order");

-- CreateIndex
CREATE INDEX "competitions_province_status_idx" ON "competitions"("province", "status");

-- CreateIndex
CREATE INDEX "payments_competition_id_status_idx" ON "payments"("competition_id", "status");

-- CreateIndex
CREATE INDEX "registrations_competition_id_status_idx" ON "registrations"("competition_id", "status");

-- CreateIndex
CREATE INDEX "registrations_coach_id_idx" ON "registrations"("coach_id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_competition_id_student_id_key" ON "registrations"("competition_id", "student_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_belt_id_fkey" FOREIGN KEY ("belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_classes" ADD CONSTRAINT "weight_classes_age_category_id_fkey" FOREIGN KEY ("age_category_id") REFERENCES "age_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_age_category_id_fkey" FOREIGN KEY ("age_category_id") REFERENCES "age_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_min_belt_id_fkey" FOREIGN KEY ("min_belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_max_belt_id_fkey" FOREIGN KEY ("max_belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_weight_class_id_fkey" FOREIGN KEY ("weight_class_id") REFERENCES "weight_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
