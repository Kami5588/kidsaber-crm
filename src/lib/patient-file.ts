import { rawAll, rawGet } from "./orm";

/**
 * Prontuário do paciente: tudo que se acumulou sobre uma criança em um lugar.
 *
 * Reúne cadastro, arquivos anexados, encaminhamentos recebidos de outros
 * profissionais, sessões com evolução, histórico de etapas e o registro de
 * quem mexeu no quê. É a tela que responde "o que já foi feito com essa
 * criança até aqui?".
 */

export function patientHeader(patientId: string) {
  return rawGet(
    `SELECT p.*, u.name AS unidade, u.state AS unidadeUf, i.name AS convenio
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     LEFT JOIN InsurancePlan i ON i.id = p.insurancePlanId
     WHERE p.id = ?`,
    [patientId]
  );
}

export function patientResponsibles(patientId: string) {
  return rawAll(
    `SELECT r.* FROM Responsible r
     JOIN PatientResponsible pr ON pr.responsibleId = r.id
     WHERE pr.patientId = ?
     ORDER BY r.fullName ASC`,
    [patientId]
  );
}

export function patientTeam(patientId: string) {
  return rawAll(
    `SELECT pf.id, pf.fullName, pf.specialty, pf.councilNumber
     FROM Professional pf
     JOIN PatientProfessional pp ON pp.professionalId = pf.id
     WHERE pp.patientId = ?
     ORDER BY pf.fullName ASC`,
    [patientId]
  );
}

/**
 * Arquivos do paciente, com quem anexou e para quem já foi encaminhado.
 *
 * O nome de quem anexou vem do User, e não do Professional: é a conta que
 * praticou o ato, e é ela que responde por ele na auditoria.
 */
export interface PatientDocument extends Record<string, any> {
  id: string;
  encaminhamentos: Record<string, any>[];
}

export function patientDocuments(patientId: string): PatientDocument[] {
  const docs = rawAll(
    `SELECT d.*, u.name AS enviadoPor
     FROM Document d
     LEFT JOIN User u ON u.id = d.uploadedById
     WHERE d.patientId = ?
     ORDER BY d.createdAt DESC`,
    [patientId]
  );

  return docs.map((d) => ({
    ...(d as Record<string, any>),
    id: d.id as string,
    encaminhamentos: rawAll(
      `SELECT s.id, s.note, s.createdAt, p.fullName AS paraProfissional, p.specialty,
              u.name AS encaminhadoPor
       FROM DocumentShare s
       JOIN Professional p ON p.id = s.professionalId
       LEFT JOIN User u ON u.id = s.sharedById
       WHERE s.documentId = ?
       ORDER BY s.createdAt DESC`,
      [d.id]
    ),
  }));
}

export function patientSessions(patientId: string, limit = 30) {
  return rawAll(
    `SELECT s.*, pf.fullName AS profissional
     FROM Session s
     LEFT JOIN Professional pf ON pf.id = s.professionalId
     WHERE s.patientId = ?
     ORDER BY s.sessionDate DESC
     LIMIT ${limit}`,
    [patientId]
  );
}

export function patientStageHistory(patientId: string) {
  return rawAll(
    `SELECT * FROM CareStageHistory WHERE patientId = ? ORDER BY createdAt DESC`,
    [patientId]
  );
}

export function patientInvoices(patientId: string) {
  return rawAll(
    `SELECT * FROM Invoice WHERE patientId = ? ORDER BY dueDate DESC LIMIT 12`,
    [patientId]
  );
}

/**
 * Registro de atividades relacionadas a este paciente.
 *
 * Cruza a trilha de auditoria com os documentos da criança, para que a ficha
 * mostre também quem baixou um laudo, e não só quem editou o cadastro.
 */
export function patientActivity(patientId: string, limit = 40) {
  return rawAll(
    `SELECT a.* FROM AuditLog a
     WHERE (a.entity = 'Patient' AND a.entityId = ?)
        OR (a.entity = 'Document' AND a.entityId IN (SELECT id FROM Document WHERE patientId = ?))
     ORDER BY a.createdAt DESC
     LIMIT ${limit}`,
    [patientId, patientId]
  );
}

/** Idade em anos e meses, do jeito que se fala de criança pequena. */
export function formatAge(birthDate?: string | null): string {
  if (!birthDate) return "-";

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "-";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 1) return `${months} ${months === 1 ? "mês" : "meses"}`;
  if (months === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${months}m`;
}
