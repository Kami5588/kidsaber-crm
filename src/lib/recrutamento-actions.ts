"use server";

import { revalidatePath } from "next/cache";
import { logAccess } from "./audit";
import { DIAS_NA_LIXEIRA, moverParaLixeira } from "./files";
import { deleteRow, rawGet, updateRow } from "./orm";
import { getCurrentUser } from "./permissions";
import { SITUACOES_CANDIDATURA } from "./recrutamento-constants";

export type AcaoState = { ok: boolean; error?: string; message?: string };


/**
 * Apaga uma candidatura e recolhe o currículo.
 *
 * A LGPD dá ao titular o direito de pedir a eliminação dos seus dados, e a
 * clínica precisa poder atender isso sem depender de quem cuida do servidor.
 *
 * O arquivo vai para a lixeira em vez de sumir: esta ação também é usada para
 * limpar a lista, e ali o clique errado é fácil. Se um dia a exclusão precisar
 * ser imediata por pedido expresso do candidato, é `deleteStoredFile` que
 * atende — é o que a eliminação de paciente usa.
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

  // Como na exclusão de documento: o currículo vai para a lixeira, porque
  // apagar a candidatura errada na lista é um clique de distância. O descarte
  // pelo prazo de guarda, esse sim, apaga de vez.
  const naLixeira = moverParaLixeira(linha.resumeStoredName as string | null);
  deleteRow("JobApplication", id);

  await logAccess({
    action: "EXCLUIR",
    entity: "JobApplication",
    entityId: id,
    detail: naLixeira
      ? `Excluiu a candidatura de ${linha.candidateName}. Currículo recuperável por ${DIAS_NA_LIXEIRA} dias como "${naLixeira}".`
      : `Excluiu a candidatura de ${linha.candidateName} (sem currículo anexado).`,
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
