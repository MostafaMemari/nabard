export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureSuperAdmin } = await import("./lib/ensure-super-admin");
  await ensureSuperAdmin().catch((error: unknown) => {
    console.error(`ensure-super-admin failed: ${error instanceof Error ? error.message : error}`);
  });
}
