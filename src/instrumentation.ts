export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-building") return;
  try {
    const { ensureSeedData } = await import("@/db/seed");
    await ensureSeedData();
  } catch {
    /* seeding is best-effort — the app still works with an empty database */
  }
}
