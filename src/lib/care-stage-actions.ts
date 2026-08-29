"use server";

import { revalidatePath } from "next/cache";
import { logAccess } from "./audit";
import { changeStage } from "./care-stages";
import { CARE_STAGES } from "./care-stage-constants";
import { canAccessPatient, getCurrentUser } from "./permissions";
import { rawGet } from "./orm";

export type StageFormState = { ok: boolean; error?: string; message?: string };

/** Move o paciente para outra etapa do acompanhamento, registrando o motivo. */
export async function changeStageAction(
  _prev: StageFormState,
  formData: FormData
): Promise<StageFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

    const patientId = String(formData.get("patientId") ?? "");
    const toStage = String(formData.get("toStage") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    if (!canAccessPatient(user, patientId)) {
      return { ok: false, error: "Você não tem acesso a este paciente." };
    }
    if (!(CARE_STAGES as readonly string[]).includes(toStage)) {
      return { ok: false, error: "Etapa inválida." };
    }

    const patient = rawGet("SELECT careStage FROM Patient WHERE id = ?", [patientId]);
    if (!patient) return { ok: false, error: "Paciente não encontrado." };

    if (patient.careStage === toStage) {
      return { ok: false, error: `O paciente já está na etapa "${toStage}".` };
    }

    changeStage(patientId, toStage, {
      fromStage: patient.careStage,
      note: note || null,
      userId: user.id,
      userName: user.displayName,
    });

    await logAccess({
      action: "EDITAR",
      entity: "Patient",
      entityId: patientId,
      detail: `Etapa alterada de "${patient.careStage ?? "sem etapa"}" para "${toStage}".${
        note ? ` Observação: ${note}` : ""
      }`,
    });

    revalidatePath(`/pacientes/${patientId}`);
    revalidatePath("/meus-pacientes");

    return { ok: true, message: `Etapa alterada para "${toStage}".` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível alterar a etapa." };
  }
}
