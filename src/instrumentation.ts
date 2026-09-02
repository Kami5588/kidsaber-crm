export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeeded, ensureOwnerAdmin, ensureUnitContacts, ensureDemoHistory } =
      await import("./lib/seed");
    ensureSeeded();
    ensureUnitContacts();
    ensureOwnerAdmin();

    // Histórico de demonstração numa base que já existe. Fica atrás de uma
    // variável porque são atendimentos inventados: úteis para mostrar o sistema
    // funcionando, indesejáveis numa base com paciente de verdade.
    const demo = (process.env.SEED_DEMO_HISTORY ?? "").trim().toLowerCase();
    if (demo === "1" || demo === "true") {
      ensureDemoHistory();
      console.log("Historico de demonstracao verificado.");
      console.log("Remova SEED_DEMO_HISTORY das variaveis depois de conferir.");
    }

    // Cópia de segurança do dia e descarte do que passou do prazo declarado.
    const { agendarManutencao } = await import("./lib/rotinas");
    agendarManutencao();
  }
}
