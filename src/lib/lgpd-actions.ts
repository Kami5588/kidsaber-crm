"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { logAccess } from "./audit";
import { deletePatientData, exportPatientData } from "./lgpd";
import { rawGet } from "./orm";
import { DELETE_CONFIRMATION } from "./lgpd-constants";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Sessão expirada. Entre novamente.");

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    throw new Error("Apenas administradores podem exercer direitos do titular.");
  }
  return session;
}

export type ExportState =
  | { ok: false; error?: string }
  | { ok: true; fileName: string; content: string };

/** Gera o pacote de dados do paciente para download (portabilidade). */
export async function exportPatientAction(
  _prev: ExportState,
  formData: FormData
): Promise<ExportState> {
  try {
    await requireAdmin();

    const patientId = String(formData.get("patientId") ?? "");
    if (!patientId) return { ok: false, error: "Selecione um paciente." };

    const patient = rawGet("SELECT fullName FROM Patient WHERE id = ?", [patientId]);
    if (!patient) return { ok: false, error: "Paciente não encontrado." };

    const data = exportPatientData(patientId);

    await logAccess({
      action: "EXPORTAR_DADOS",
      entity: "Patient",
      entityId: patientId,
      detail: `Exportação de dados a pedido do titular (${data.sessoes.length} sessões incluídas).`,
    });

    const slug = String(patient.fullName)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();

    return {
      ok: true,
      fileName: `dados-${slug}-${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(data, null, 2),
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível exportar os dados." };
  }
}

export type DeleteState = { ok: boolean; error?: string; message?: string };

/** Exclui em definitivo os dados do paciente (direito de eliminação). */
export async function deletePatientAction(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  try {
    await requireAdmin();

    const patientId = String(formData.get("patientId") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "").trim();

    if (!patientId) return { ok: false, error: "Selecione um paciente." };
    if (confirmation !== DELETE_CONFIRMATION) {
      return {
        ok: false,
        error: `Para confirmar, digite exatamente: ${DELETE_CONFIRMATION}`,
      };
    }

    const patient = rawGet("SELECT fullName FROM Patient WHERE id = ?", [patientId]);
    if (!patient) return { ok: false, error: "Paciente não encontrado." };

    const summary = deletePatientData(patientId);

    // O registro de auditoria guarda apenas o identificador e os totais: manter
    // o nome aqui recriaria justamente o dado que acabou de ser eliminado.
    await logAccess({
      action: "EXCLUIR_DADOS_TITULAR",
      entity: "Patient",
      entityId: patientId,
      detail:
        `Exclusão definitiva a pedido do titular. Removidos: ` +
        `${summary.sessoes} sessões, ${summary.faturas} faturas, ` +
        `${summary.documentos} documentos, ${summary.avaliacoes} avaliações, ` +
        `${summary.tarefas} tarefas, ${summary.interacoes} interações, ` +
        `${summary.vinculos} vínculos.`,
    });

    revalidatePath("/pacientes");
    revalidatePath("/dashboard");
    revalidatePath("/lgpd");

    return {
      ok: true,
      message:
        `Dados excluídos definitivamente. Foram removidos ${summary.sessoes} sessões, ` +
        `${summary.faturas} faturas, ${summary.documentos} documentos e ` +
        `${summary.avaliacoes} avaliações.`,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível excluir os dados." };
  }
}
