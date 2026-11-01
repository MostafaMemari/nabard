-- CreateTable
CREATE TABLE "login_failures" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_failures_key_created_at_idx" ON "login_failures"("key" ASC, "created_at" ASC);
