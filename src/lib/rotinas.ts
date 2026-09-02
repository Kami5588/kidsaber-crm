import { gerarCopiaDoDia } from "./backup";
import { pruneAuditLog } from "./audit";
import { pruneLoginAttempts } from "./login-guard";

/**
 * Manutenção diária.
 *
 * Duas das promessas feitas ao titular na política de privacidade dependiam de
 * código que ninguém chamava:
 *
 *   - "ambiente com rotina de backup" — não havia rotina nenhuma
 *   - trilha de auditoria "mantida por 180 dias" — pruneAuditLog existia, mas
 *     nunca era executada, e a trilha crescia para sempre. Guardar registro de
 *     acesso a prontuário além do prazo declarado contraria a própria política.
 *
 * Roda na subida do processo e depois uma vez por dia. Não há agendador no
 * Railway; o container reinicia de tempos em tempos, e a execução na subida
 * garante que uma parada longa não deixe o sistema dias sem cópia.
 */

const UM_DIA = 24 * 60 * 60 * 1000;

declare global {
  var __kidsaberRotinas: NodeJS.Timeout | undefined;
}

export function executarManutencao(): void {
  try {
    const r = gerarCopiaDoDia();
    if (r.criada) console.log(`[manutencao] copia de seguranca criada: ${r.nome}`);
  } catch (err) {
    // Uma falha no backup não pode impedir o sistema de subir: é melhor a
    // clínica atender sem a cópia do dia do que não atender.
    console.error("[manutencao] falha ao gerar copia de seguranca:", err);
  }

  try {
    const apagados = pruneAuditLog();
    if (apagados > 0) console.log(`[manutencao] registros de auditoria descartados: ${apagados}`);
  } catch (err) {
    console.error("[manutencao] falha ao descartar auditoria antiga:", err);
  }

  try {
    pruneLoginAttempts();
  } catch (err) {
    console.error("[manutencao] falha ao limpar tentativas de login:", err);
  }
}

export function agendarManutencao(): void {
  // O guard global evita dois temporizadores quando o Next recarrega o módulo
  // em desenvolvimento.
  if (globalThis.__kidsaberRotinas) return;

  executarManutencao();

  const t = setInterval(executarManutencao, UM_DIA);
  // Não segura o processo vivo só por causa do temporizador.
  t.unref?.();
  globalThis.__kidsaberRotinas = t;
}
