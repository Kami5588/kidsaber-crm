"use server";

import { revalidatePath } from "next/cache";
import { logAccess } from "./audit";
import { deleteStoredFile } from "./files";
import { deleteRow, rawGet, updateRow } from "./orm";
import { getCurrentUser } from "./permissions";
import { SITUACOES_CANDIDATURA } from "./recrutamento-constants";

export type AcaoState = { ok: boolean; error?: string; message?: string };


/**
 * Apaga uma candidatura e o currículo junto.
 *
 * A LGPD dá ao titular o direito de pedir a eliminação dos seus dados, e a
 * clínica precisa poder atender isso sem depender de quem cuida do servidor.
 * O arquivo sai do volume antes da linha: se a ordem fosse a inversa, uma
 * falha no meio deixaria o documento no disco sem nada que o aponte.
 */
export async function excluirCandidaturaAction(id: string): Promise<AcaoState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Apenas a administração pode excluir candidaturas." };
  }

  const linha = rawGet(
    "SELECT candidateName, resumeStoredName FROM JobApplication WHERE id = ?",
    [id]
  );
  if (!linha) return { ok: false, error: "Candidatura não encontrada." };

  deleteStoredFile(linha.resumeStoredName as string | null);
  deleteRow("JobApplication", id);

  await logAccess({
    action: "EXCLUIR",
    entity: "JobApplication",
    entityId: id,
    detail: `Excluiu a candidatura de ${linha.candidateName} e o currículo anexado.`,
  });

  revalidatePath("/vagas");
  return { ok: true, message: "Candidatura excluída." };
}

/** Move a candidatura de etapa, para a coordenação acompanhar o processo. */
export async function mudarSituacaoAction(id: string, situacao: string): Promise<AcaoState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Apenas a administração pode alterar candidaturas." };
  }
  if (!SITUACOES_CANDIDATURA.includes(situacao as any)) {
    return { ok: false, error: "Situação inválida." };
  }

  const linha = rawGet("SELECT candidateName FROM JobApplication WHERE id = ?", [id]);
  if (!linha) return { ok: false, error: "Candidatura não encontrada." };

  updateRow("JobApplication", id, { status: situacao });

  await logAccess({
    action: "EDITAR",
    entity: "JobApplication",
    entityId: id,
    detail: `Candidatura de ${linha.candidateName} passou para "${situacao}".`,
  });

  revalidatePath("/vagas");
  return { ok: true, message: "Situação atualizada." };
}

/** Encerra uma vaga, tirando-a do site sem apagar o histórico. */
export async function encerrarVagaAction(id: string): Promise<AcaoState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Apenas a administração pode encerrar vagas." };
  }

  const vaga = rawGet("SELECT title, status FROM JobOpening WHERE id = ?", [id]);
  if (!vaga) return { ok: false, error: "Vaga não encontrada." };

  // Encerrar não apaga: as candidaturas recebidas continuam ligadas à vaga, e
  // saber para qual posição a pessoa se candidatou é metade da informação.
  const novo = vaga.status === "Aberta" ? "Encerrada" : "Aberta";
  updateRow("JobOpening", id, { status: novo });

  await logAccess({
    action: "EDITAR",
    entity: "JobOpening",
    entityId: id,
    detail: `Vaga "${vaga.title}" ${novo === "Aberta" ? "reaberta no site" : "encerrada e retirada do site"}.`,
  });

  revalidatePath("/vagas");
  return { ok: true, message: novo === "Aberta" ? "Vaga reaberta." : "Vaga encerrada." };
}
