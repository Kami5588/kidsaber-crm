export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeeded, ensureOwnerAdmin, ensureUnitContacts } =
      await import("./lib/seed");
    ensureSeeded();
    ensureUnitContacts();
    ensureOwnerAdmin();

    // Cópia de segurança do dia e descarte do que passou do prazo declarado.
    const { agendarManutencao } = await import("./lib/rotinas");
    agendarManutencao();
  }
}
