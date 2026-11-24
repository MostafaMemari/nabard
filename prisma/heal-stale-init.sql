-- Heals the one stale failed row left in the production _prisma_migrations
-- table: 20260427150207_init belongs to the pre-squash migration lineage that
-- no longer exists in this repository, so `prisma migrate resolve` cannot
-- touch it (P3017: migration not found). Something marked it failed on
-- 2026-11-18, and since P3009 blocks every deploy while any row is failed,
-- the build chain finalizes this row directly.
--
-- The row's DDL was applied to the database long before the squash (the app
-- runs on that schema), so marking it finished is truthful. The WHERE clause
-- only matches an unfinished, not-rolled-back row, which makes this
-- idempotent; genuinely failed current-lineage migrations keep surfacing.
UPDATE _prisma_migrations
SET finished_at = started_at,
    logs = 'resolved by build: stale pre-squash init row found failed on 2026-11-18'
WHERE migration_name = '20260427150207_init'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;
