export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeeded, ensureOwnerAdmin } = await import("./lib/seed");
    ensureSeeded();
    ensureOwnerAdmin();
  }
}
