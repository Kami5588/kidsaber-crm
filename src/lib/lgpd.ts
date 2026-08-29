import { rawAll, rawGet } from "./orm";
import { db } from "./db";

/**
 * Direitos do titular previstos na LGPD (art. 18).
 *
 * Cobre acesso e portabilidade (exportação em formato aberto) e eliminação
 * (exclusão definitiva). No caso de criança, quem exerce esses direitos é o
 * responsável legal.
 */

export interface PatientExport {
  exportadoEm: string;
  paciente: Record<string, any> | undefined;
  responsaveis: Record<string, any>[];
  profissionais: Record<string, any>[];
  sessoes: Record<string, any>[];
  faturas: Record<string, any>[];
  documentos: Record<string, any>[];
  avaliacoes: Record<string, any>[];
  tarefas: Record<string, any>[];
  interacoes: Record<string, any>[];
}

/**
 * Reúne tudo o que o sistema guarda sobre um paciente.
 *
 * Os campos sensíveis chegam já decifrados pelo ORM: a portabilidade só faz
 * sentido se a família receber o conteúdo legível.
 */
export function exportPatientData(patientId: string): PatientExport {
  const paciente = rawGet(
    `SELECT p.*, u.name AS unidade, i.name AS convenio
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     LEFT JOIN InsurancePlan i ON i.id = p.insurancePlanId
     WHERE p.id = ?`,
    [patientId]
  );

  return {
    exportadoEm: new Date().toISOString(),
    paciente,
    responsaveis: rawAll(
      `SELECT r.* FROM Responsible r
       JOIN PatientResponsible pr ON pr.responsibleId = r.id
       WHERE pr.patientId = ?`,
      [patientId]
    ),
    profissionais: rawAll(
      `SELECT pf.fullName, pf.specialty, pf.councilNumber FROM Professional pf
       JOIN PatientProfessional pp ON pp.professionalId = pf.id
       WHERE pp.patientId = ?`,
      [patientId]
    ),
    sessoes: rawAll(
      `SELECT s.*, pf.fullName AS profissional FROM Session s
       LEFT JOIN Professional pf ON pf.id = s.professionalId
       WHERE s.patientId = ? ORDER BY s.sessionDate DESC`,
      [patientId]
    ),
    faturas: rawAll(`SELECT * FROM Invoice WHERE patientId = ? ORDER BY dueDate DESC`, [patientId]),
    documentos: rawAll(`SELECT * FROM Document WHERE patientId = ?`, [patientId]),
    avaliacoes: rawAll(`SELECT * FROM SatisfactionSurvey WHERE patientId = ?`, [patientId]),
    tarefas: rawAll(`SELECT * FROM Task WHERE relatedPatientId = ?`, [patientId]),
    interacoes: rawAll(`SELECT * FROM Interaction WHERE relatedPatientId = ?`, [patientId]),
  };
}

export interface DeletionSummary {
  sessoes: number;
  faturas: number;
  documentos: number;
  avaliacoes: number;
  tarefas: number;
  interacoes: number;
  vinculos: number;
}

/**
 * Apaga em definitivo o paciente e tudo que se liga a ele.
 *
 * Roda em transação: uma exclusão pela metade deixaria registros órfãos
 * apontando para um paciente que não existe mais.
 *
 * Atenção: a legislação de saúde exige guarda do prontuário por prazo próprio,
 * que pode se sobrepor ao pedido de eliminação. A decisão de atender ou recusar
 * é da clínica; a função apenas executa.
 */
export function deletePatientData(patientId: string): DeletionSummary {
  const count = (sql: string) => (rawGet(sql, [patientId])?.c ?? 0) as number;

  const summary: DeletionSummary = {
    sessoes: count("SELECT COUNT(*) as c FROM Session WHERE patientId = ?"),
    faturas: count("SELECT COUNT(*) as c FROM Invoice WHERE patientId = ?"),
    documentos: count("SELECT COUNT(*) as c FROM Document WHERE patientId = ?"),
    avaliacoes: count("SELECT COUNT(*) as c FROM SatisfactionSurvey WHERE patientId = ?"),
    tarefas: count("SELECT COUNT(*) as c FROM Task WHERE relatedPatientId = ?"),
    interacoes: count("SELECT COUNT(*) as c FROM Interaction WHERE relatedPatientId = ?"),
    vinculos:
      count("SELECT COUNT(*) as c FROM PatientResponsible WHERE patientId = ?") +
      count("SELECT COUNT(*) as c FROM PatientProfessional WHERE patientId = ?"),
  };

  db.exec("BEGIN");
  try {
    for (const sql of [
      "DELETE FROM SatisfactionSurvey WHERE patientId = ?",
      "DELETE FROM Document WHERE patientId = ?",
      "DELETE FROM Invoice WHERE patientId = ?",
      "DELETE FROM Session WHERE patientId = ?",
      "DELETE FROM Task WHERE relatedPatientId = ?",
      "DELETE FROM Interaction WHERE relatedPatientId = ?",
      "DELETE FROM PatientResponsible WHERE patientId = ?",
      "DELETE FROM PatientProfessional WHERE patientId = ?",
      "DELETE FROM Patient WHERE id = ?",
    ]) {
      db.prepare(sql).run(patientId);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return summary;
}

/** Lista enxuta de pacientes, para escolher o titular na tela. */
export function listPatientsForLgpd() {
  return rawAll(
    `SELECT p.id, p.fullName, p.birthDate, p.status, u.name AS unidade
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     ORDER BY p.fullName ASC`
  );
}
