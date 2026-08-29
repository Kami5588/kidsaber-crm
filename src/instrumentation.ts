export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeeded, ensureOwnerAdmin, ensureUnitContacts } = await import("./lib/seed");
    ensureSeeded();
    ensureUnitContacts();
    ensureOwnerAdmin();
  }
}
