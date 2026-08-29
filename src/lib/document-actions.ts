"use server";

import { revalidatePath } from "next/cache";
import { logAccess } from "./audit";
import { canAccessDocument, documentShares, getDocument } from "./documents";
import { deleteStoredFile, saveUploadedFile } from "./files";
import { canAccessPatient, getCurrentUser } from "./permissions";
import { deleteRow, insertRow, rawGet } from "./orm";

export type DocumentFormState = { ok: boolean; error?: string; message?: string };

const DOCUMENT_TYPES = [
  "Laudo",
  "Atestado",
  "Contrato",
  "Anamnese",
  "Relatório",
  "Receita",
  "Encaminhamento",
  "Outro",
];

/** Anexa um arquivo ao prontuário do paciente. */
export async function uploadDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

    const patientId = String(formData.get("patientId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "Outro");
    const visible = formData.get("visibleToResponsible") === "on";
    const file = formData.get("file") as File | null;

    if (!patientId) return { ok: false, error: "Selecione o paciente." };
    if (!name) return { ok: false, error: "Dê um nome ao documento." };
    if (!DOCUMENT_TYPES.includes(type)) return { ok: false, error: "Tipo de documento inválido." };

    // Anexar arquivo a um paciente que não é seu seria contornar o recorte de
    // acesso pela porta dos fundos.
    if (!canAccessPatient(user, patientId)) {
      return { ok: false, error: "Você não tem acesso a este paciente." };
    }

    const stored = await saveUploadedFile(file as File);

    const patient = rawGet("SELECT unitId FROM Patient WHERE id = ?", [patientId]);

    const id = insertRow("Document", {
      patientId,
      unitId: patient?.unitId ?? null,
      name,
      type,
      fileUrl: `/api/documentos/${stored.storedName}`,
      storedName: stored.storedName,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      uploadDate: new Date().toISOString().slice(0, 10),
      uploadedById: user.id,
      visibleToResponsible: visible ? 1 : 0,
    });

    await logAccess({
      action: "CRIAR",
      entity: "Document",
      entityId: id,
      detail: `Arquivo "${stored.originalName}" anexado ao paciente ${patientId}.`,
    });

    revalidatePath("/documentos");
    return { ok: true, message: `Arquivo "${stored.originalName}" anexado.` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível anexar o arquivo." };
  }
}

/** Encaminha o documento para outro profissional. */
export async function shareDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

    const documentId = String(formData.get("documentId") ?? "");
    const professionalId = String(formData.get("professionalId") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    if (!documentId || !professionalId) {
      return { ok: false, error: "Escolha o documento e o profissional." };
    }
    if (!canAccessDocument(user, documentId)) {
      return { ok: false, error: "Você não tem acesso a este documento." };
    }

    const already = rawGet(
      "SELECT id FROM DocumentShare WHERE documentId = ? AND professionalId = ?",
      [documentId, professionalId]
    );
    if (already) return { ok: false, error: "Este documento já foi encaminhado a esse profissional." };

    insertRow("DocumentShare", {
      documentId,
      professionalId,
      sharedById: user.id,
      note: note || null,
    });

    const doc = getDocument(documentId);
    const prof = rawGet("SELECT fullName FROM Professional WHERE id = ?", [professionalId]);

    await logAccess({
      action: "EDITAR",
      entity: "Document",
      entityId: documentId,
      detail: `Documento "${doc?.name}" encaminhado para ${prof?.fullName}.`,
    });

    revalidatePath("/documentos");
    return { ok: true, message: `Documento encaminhado para ${prof?.fullName}.` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível encaminhar o documento." };
  }
}

/** Remove o encaminhamento, revogando o acesso do profissional. */
export async function revokeShareAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada." };

    const shareId = String(formData.get("shareId") ?? "");
    const share = rawGet("SELECT documentId FROM DocumentShare WHERE id = ?", [shareId]);
    if (!share) return { ok: false, error: "Encaminhamento não encontrado." };

    if (!canAccessDocument(user, share.documentId)) {
      return { ok: false, error: "Você não tem acesso a este documento." };
    }

    deleteRow("DocumentShare", shareId);

    await logAccess({
      action: "EDITAR",
      entity: "Document",
      entityId: share.documentId,
      detail: "Encaminhamento revogado.",
    });

    revalidatePath("/documentos");
    return { ok: true, message: "Encaminhamento revogado." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível revogar." };
  }
}

/** Exclui o documento e apaga o arquivo do disco. */
export async function deleteDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada." };

    const documentId = String(formData.get("documentId") ?? "");
    if (!canAccessDocument(user, documentId)) {
      return { ok: false, error: "Você não tem acesso a este documento." };
    }

    const doc = getDocument(documentId);
    if (!doc) return { ok: false, error: "Documento não encontrado." };

    // Apaga primeiro os encaminhamentos, para não deixar referência a um
    // documento que não existe mais.
    for (const share of documentShares(documentId)) deleteRow("DocumentShare", share.id);

    deleteRow("Document", documentId);
    deleteStoredFile(doc.storedName);

    await logAccess({
      action: "EXCLUIR",
      entity: "Document",
      entityId: documentId,
      detail: `Documento "${doc.name}" excluído junto com o arquivo.`,
    });

    revalidatePath("/documentos");
    return { ok: true, message: "Documento excluído." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível excluir." };
  }
}
