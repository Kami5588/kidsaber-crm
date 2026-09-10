import { gerarCopiaDoDia } from "./backup";
import { pruneAuditLog } from "./audit";
import { pruneLoginAttempts } from "./login-guard";
import { descartarCurriculosVencidos } from "./recrutamento";
import { esvaziarLixeiraVencida } from "./files";
import { recolherArquivosOrfaos } from "./manutencao-arquivos";

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
 * Depois entrou também o descarte dos currículos vencidos: quem manda currículo
 * é titular de dados como qualquer outro, e guardar o documento para sempre
 * seria reter dado pessoal sem finalidade nem prazo.
 *
 * E, por fim, o cuidado com o volume, que a cópia do banco não alcança: apagar
 * o que já passou do prazo na lixeira e recolher arquivo que nenhum registro
 * aponta mais.
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

  try {
    const descartados = descartarCurriculosVencidos();
    if (descartados > 0) console.log(`[manutencao] curriculos descartados: ${descartados}`);
  } catch (err) {
    console.error("[manutencao] falha ao descartar curriculos vencidos:", err);
  }

  try {
    const apagados = esvaziarLixeiraVencida();
    if (apagados > 0) console.log(`[manutencao] arquivos apagados da lixeira: ${apagados}`);
  } catch (err) {
    console.error("[manutencao] falha ao esvaziar a lixeira:", err);
  }

  try {
    const { recolhidos } = recolherArquivosOrfaos();
    if (recolhidos > 0) console.log(`[manutencao] arquivos orfaos recolhidos: ${recolhidos}`);
  } catch (err) {
    // A varredura desiste inteira se qualquer consulta falhar. É de propósito:
    // continuar com uma lista incompleta de arquivos em uso faria a rotina
    // recolher laudo que está sendo usado.
    console.error("[manutencao] falha ao varrer arquivos orfaos:", err);
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
