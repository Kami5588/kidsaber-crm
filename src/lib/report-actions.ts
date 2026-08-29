"use server";

import { logAccess } from "./audit";
import { getCurrentUser } from "./permissions";
import { buildCsv } from "./reports";

export type CsvState =
  | { ok: false; error?: string }
  | { ok: true; fileName: string; content: string };

/**
 * Gera o CSV do relatório mensal para download.
 *
 * O arquivo é montado no navegador a partir deste conteúdo, sem gravar nada no
 * servidor — o relatório traz faturamento e volume de atendimento, e não há
 * motivo para deixar isso em disco.
 */
export async function exportMonthlyReportAction(
  _prev: CsvState,
  formData: FormData
): Promise<CsvState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

    // Faturamento não é assunto de quem atende: o relatório fica com a
    // administração e a recepção, que já enxergam o financeiro.
    if (user.role === "PROFISSIONAL") {
      return { ok: false, error: "Seu perfil não tem acesso ao relatório gerencial." };
    }

    const month = String(formData.get("month") ?? "");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return { ok: false, error: "Escolha uma competência válida." };
    }

    const unitId = String(formData.get("unitId") ?? "") || null;
    const content = buildCsv(month, unitId);

    await logAccess({
      action: "EXPORTAR_DADOS",
      entity: "Relatorio",
      detail: `Relatório gerencial de ${month} exportado em CSV.`,
    });

    return { ok: true, fileName: `relatorio-kidsaber-${month}.csv`, content };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível gerar o relatório." };
  }
}
