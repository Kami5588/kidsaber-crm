"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEntity } from "./entities";
import { deleteRow, insertRow, updateRow } from "./orm";

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
