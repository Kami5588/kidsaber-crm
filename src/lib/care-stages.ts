import { insertRow, rawAll, updateRow } from "./orm";
import { CARE_STAGES, STAGE_META } from "./care-stage-constants";

export * from "./care-stage-constants";

/**
 * Registra a mudança de etapa e atualiza o paciente.
 *
 * O histórico é o que permite responder "há quanto tempo essa criança está
 * parada na avaliação?", pergunta que o campo atual sozinho não responde.
 */
export function changeStage(
  patientId: string,
  toStage: string,
  opts: { fromStage?: string | null; note?: string | null; userId?: string | null; userName?: string | null }
): void {
  updateRow("Patient", patientId, { careStage: toStage }, { touchUpdatedAt: true });

  insertRow("CareStageHistory", {
    patientId,
    fromStage: opts.fromStage ?? null,
    toStage,
    note: opts.note ?? null,
    changedById: opts.userId ?? null,
    changedByName: opts.userName ?? null,
  });
}

export function stageHistory(patientId: string) {
  return rawAll(
    `SELECT * FROM CareStageHistory WHERE patientId = ? ORDER BY createdAt DESC`,
    [patientId]
  );
}

/** Distribuição dos pacientes pelas etapas, para o painel de acompanhamento. */
export function stageSummary(where = "1=1", params: any[] = []) {
  const rows = rawAll(
    `SELECT COALESCE(careStage, 'Sem etapa') AS stage, COUNT(*) AS total
     FROM Patient p WHERE ${where}
     GROUP BY COALESCE(careStage, 'Sem etapa')`,
    params
  );

  const byStage = new Map(rows.map((r) => [r.stage, r.total as number]));

  return CARE_STAGES.map((stage) => ({
    stage,
    total: byStage.get(stage) ?? 0,
    ...STAGE_META[stage],
  }));
}
