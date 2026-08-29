"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEntity } from "./entities";
import { deleteRow, insertRow, updateRow } from "./orm";
import { cookies } from "next/headers";
import { UNIT_COOKIE } from "./unit-constants";
import { z } from "zod";

function parseValue(type: string, raw: FormDataEntryValue | null, multi?: FormDataEntryValue[]) {
  if (type === "checkbox") return raw ? 1 : 0;
  if (type === "multiselect") return (multi ?? []).join(",");
  if (type === "number") {
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }
  if (raw === null) return null;
  const s = String(raw);
  return s === "" ? null : s;
}

function buildPayload(entityKey: string, formData: FormData): Record<string, any> {
  const entity = getEntity(entityKey);
  if (!entity) throw new Error("Entidade inválida");
  const payload: Record<string, any> = {};
  for (const field of entity.fields) {
    if (field.type === "multiselect") {
      const values = formData.getAll(field.name) as string[];
      payload[field.name] = values.join(",");
    } else {
      const raw = formData.get(field.name);
      payload[field.name] = parseValue(field.type, raw);
    }
  }
  return payload;
}

export async function createEntity(entityKey: string, formData: FormData) {
  const entity = getEntity(entityKey);
  if (!entity) throw new Error("Entidade inválida");
  const payload = buildPayload(entityKey, formData);
  const withTs = entity.table === "Patient";
  insertRow(entity.table, payload, {
    withTimestamps: true,
    timestampFields: withTs ? ["createdAt", "updatedAt"] : ["createdAt"],
  });
  revalidatePath(`/${entityKey}`);
  redirect(`/${entityKey}`);
}

export async function updateEntity(entityKey: string, id: string, formData: FormData) {
  const entity = getEntity(entityKey);
  if (!entity) throw new Error("Entidade inválida");
  const payload = buildPayload(entityKey, formData);
  updateRow(entity.table, id, payload, { touchUpdatedAt: entity.table === "Patient" });
  revalidatePath(`/${entityKey}`);
  redirect(`/${entityKey}`);
}

export async function deleteEntity(entityKey: string, id: string) {
  const entity = getEntity(entityKey);
  if (!entity) throw new Error("Entidade inválida");
  deleteRow(entity.table, id);
  revalidatePath(`/${entityKey}`);
}

export async function setActiveUnit(unitId: string) {
  cookies().set(UNIT_COOKIE, unitId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // A unidade ativa muda o resultado de praticamente toda consulta do sistema,
  // então o cache inteiro do app precisa ser reavaliado.
  revalidatePath("/", "layout");
}

/* -------------------------------------------------------------------------
 * Formulário público da landing page
 * ---------------------------------------------------------------------- */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(160),
  phone: z.string().trim().max(40).optional(),
  unitId: z.string().trim().max(64).optional(),
  interestedSpecialty: z.string().trim().max(60).optional(),
  message: z.string().trim().min(5, "Conte um pouco sobre o que você precisa.").max(2000),
  // Campo isca: fica escondido no formulário, então só um robô preenche.
  website: z.string().max(0).optional(),
});

export type ContactState = { ok: boolean; error?: string };

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    unitId: formData.get("unitId") ?? "",
    interestedSpecialty: formData.get("interestedSpecialty") ?? "",
    message: formData.get("message") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os dados informados." };
  }

  const d = parsed.data;
  if (d.website) return { ok: true }; // robô: finge sucesso e descarta

  insertRow("Lead", {
    unitId: d.unitId || null,
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    message: d.message,
    interestedSpecialty: d.interestedSpecialty || null,
    status: "Novo",
    origin: "Site",
    priority: "Media",
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}
