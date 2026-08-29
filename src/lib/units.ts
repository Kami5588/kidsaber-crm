import { cookies } from "next/headers";
import { rawAll, rawGet } from "./orm";

import { ALL_UNITS, UNIT_COOKIE } from "./unit-constants";

export { ALL_UNITS, UNIT_COOKIE };

export interface Unit {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isMain: number;
  status: string;
}

/** Unidades ativas, matriz primeiro e depois em ordem alfabética. */
export function listUnits(): Unit[] {
  return rawAll(
    `SELECT * FROM Unit WHERE status = 'Ativo' ORDER BY isMain DESC, name ASC`
  ) as Unit[];
}

export function getUnit(id: string): Unit | undefined {
  return rawGet(`SELECT * FROM Unit WHERE id = ?`, [id]) as Unit | undefined;
}

/**
 * Unidade selecionada no momento, lida do cookie.
 *
 * Retorna ALL_UNITS para a visão consolidada. Se o cookie apontar para uma
 * unidade que não existe mais (removida ou inativada), cai na consolidada em
 * vez de devolver um id inválido que filtraria tudo para zero.
 */
export function getActiveUnitId(): string {
  const raw = cookies().get(UNIT_COOKIE)?.value;
  if (!raw || raw === ALL_UNITS) return ALL_UNITS;
  return getUnit(raw) ? raw : ALL_UNITS;
}

export function getActiveUnit(): Unit | null {
  const id = getActiveUnitId();
  return id === ALL_UNITS ? null : getUnit(id) ?? null;
}

/**
 * Fragmento SQL para escopar uma consulta à unidade ativa.
 *
 * `alias` é o prefixo da tabela na query (ex.: "s" em `FROM Session s`).
 * Na visão consolidada devolve uma cláusula sempre verdadeira, para que o
 * chamador possa concatenar sem se preocupar com casos especiais.
 *
 * Registros com unitId NULL (anteriores à multiunidade) aparecem em todas as
 * visões, para nunca sumirem silenciosamente da tela.
 */
export function unitFilter(alias?: string): { sql: string; params: string[] } {
  const id = getActiveUnitId();
  const col = alias ? `${alias}.unitId` : "unitId";
  if (id === ALL_UNITS) return { sql: "1=1", params: [] };
  return { sql: `(${col} = ? OR ${col} IS NULL)`, params: [id] };
}
