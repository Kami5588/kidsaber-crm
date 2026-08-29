import { rawAll, rawGet } from "./orm";
import { patientScope, type CurrentUser } from "./permissions";

/**
 * Consultas de documentos, sempre respeitando o recorte do usuário.
 *
 * Um profissional enxerga os documentos dos pacientes que atende e também os
 * que outro colega encaminhou para ele — é assim que um laudo circula entre
 * setores sem abrir o arquivo inteiro da clínica.
 */

export interface DocumentRow {
  id: string;
  patientId: string;
  name: string;
  type: string;
  fileUrl: string | null;
  storedName: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadDate: string;
  visibleToResponsible: number;
  createdAt: string;
  patientName?: string;
  sharedCount?: number;
  sharedWithMe?: number;
}

export function listDocuments(user: CurrentUser | null): DocumentRow[] {
  if (!user) return [];

  // Admin e recepção veem tudo; profissional vê o dos seus pacientes mais o
  // que foi compartilhado com ele.
  if (user.role === "ADMIN" || user.role === "RECEPCAO") {
    return rawAll(
      `SELECT d.*, p.fullName AS patientName,
        (SELECT COUNT(*) FROM DocumentShare s WHERE s.documentId = d.id) AS sharedCount
       FROM Document d
       JOIN Patient p ON p.id = d.patientId
       ORDER BY d.createdAt DESC`
    ) as DocumentRow[];
  }

  const scope = patientScope(user, "p");
  return rawAll(
    `SELECT d.*, p.fullName AS patientName,
      (SELECT COUNT(*) FROM DocumentShare s WHERE s.documentId = d.id) AS sharedCount,
      (SELECT COUNT(*) FROM DocumentShare s WHERE s.documentId = d.id AND s.professionalId = ?) AS sharedWithMe
     FROM Document d
     JOIN Patient p ON p.id = d.patientId
     WHERE ${scope.sql}
        OR d.id IN (SELECT documentId FROM DocumentShare WHERE professionalId = ?)
     ORDER BY d.createdAt DESC`,
    [user.professionalId ?? "", ...scope.params, user.professionalId ?? ""]
  ) as DocumentRow[];
}

export function getDocument(id: string): DocumentRow | undefined {
  return rawGet(
    `SELECT d.*, p.fullName AS patientName
     FROM Document d
     JOIN Patient p ON p.id = d.patientId
     WHERE d.id = ?`,
    [id]
  ) as DocumentRow | undefined;
}

/** Decide se o usuário pode abrir ou baixar um documento. */
export function canAccessDocument(user: CurrentUser | null, documentId: string): boolean {
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "RECEPCAO") return true;
  if (!user.professionalId) return false;

  const row = rawGet(
    `SELECT 1 AS ok FROM Document d
     WHERE d.id = ?
       AND (
         d.patientId IN (SELECT patientId FROM PatientProfessional WHERE professionalId = ?)
         OR d.id IN (SELECT documentId FROM DocumentShare WHERE professionalId = ?)
       )`,
    [documentId, user.professionalId, user.professionalId]
  );
  return !!row;
}

/** Com quem o documento já foi compartilhado. */
export function documentShares(documentId: string) {
  return rawAll(
    `SELECT s.*, p.fullName AS professionalName, p.specialty
     FROM DocumentShare s
     JOIN Professional p ON p.id = s.professionalId
     WHERE s.documentId = ?
     ORDER BY s.createdAt DESC`,
    [documentId]
  );
}

/** Pacientes que o usuário pode anexar documento. */
export function selectablePatients(user: CurrentUser | null) {
  if (!user) return [];

  const scope = patientScope(user, "p");
  return rawAll(
    `SELECT p.id, p.fullName, u.name AS unidade
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE ${scope.sql}
     ORDER BY p.fullName ASC`,
    scope.params
  );
}

/** Profissionais disponíveis para encaminhamento. */
export function shareableProfessionals(excludeProfessionalId?: string | null) {
  return rawAll(
    `SELECT p.id, p.fullName, p.specialty, u.name AS unidade
     FROM Professional p
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE p.status = 'Ativo' AND p.id != ?
     ORDER BY p.fullName ASC`,
    [excludeProfessionalId ?? ""]
  );
}
