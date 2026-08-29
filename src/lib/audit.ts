import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { insertRow, rawAll, rawGet } from "./orm";

/**
 * Trilha de auditoria (LGPD art. 37).
 *
 * Registra quem acessou ou alterou dados sensíveis, quando e de onde. É o que
 * permite à clínica demonstrar controle sobre prontuários e investigar um
 * acesso indevido.
 */

export type AuditAction =
  | "LOGIN_SUCESSO"
  | "LOGIN_FALHA"
  | "LOGIN_BLOQUEADO"
  | "VISUALIZAR"
  | "LISTAR"
  | "CRIAR"
  | "EDITAR"
  | "EXCLUIR"
  | "EXPORTAR_DADOS"
  | "EXCLUIR_DADOS_TITULAR";

export interface AuditEntry {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  detail?: string;
  /** Usado quando não há sessão ativa, como nas tentativas de login. */
  userEmail?: string;
}

/** IP de origem, considerando os cabeçalhos que o proxy do Railway adiciona. */
function clientIp(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

/**
 * Grava uma entrada na trilha.
 *
 * Nunca lança: auditoria que derruba a página em uso seria pior do que a
 * lacuna no registro. A falha é reportada no log do servidor.
 */
export async function logAccess(entry: AuditEntry): Promise<void> {
  try {
    const h = headers();
    let userId: string | null = null;
    let userEmail = entry.userEmail ?? null;

    if (!userEmail) {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id ?? null;
      userEmail = session?.user?.email ?? null;
    }

    insertRow("AuditLog", {
      userId,
      userEmail,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? null,
      ip: clientIp(h),
      userAgent: h.get("user-agent"),
    });
  } catch (err) {
    console.error("[auditoria] falha ao registrar acesso:", err);
  }
}

/**
 * Variante para uso fora do ciclo de requisição do App Router, como dentro do
 * `authorize` do NextAuth, onde `headers()` não está disponível.
 */
export function logAccessRaw(entry: AuditEntry & { ip?: string | null; userAgent?: string | null }) {
  try {
    insertRow("AuditLog", {
      userId: null,
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    console.error("[auditoria] falha ao registrar acesso:", err);
  }
}

export interface AuditFilters {
  action?: string;
  email?: string;
  limit?: number;
}

export function listAuditLog(filters: AuditFilters = {}) {
  const clauses: string[] = [];
  const params: any[] = [];

  if (filters.action) {
    clauses.push("action = ?");
    params.push(filters.action);
  }
  if (filters.email) {
    clauses.push("userEmail LIKE ?");
    params.push(`%${filters.email}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 200, 500);

  return rawAll(
    `SELECT * FROM AuditLog ${where} ORDER BY createdAt DESC LIMIT ${limit}`,
    params
  );
}

export function auditStats() {
  const total = (rawGet("SELECT COUNT(*) as c FROM AuditLog")?.c ?? 0) as number;
  const last24h = (rawGet(
    "SELECT COUNT(*) as c FROM AuditLog WHERE createdAt >= ?",
    [new Date(Date.now() - 24 * 3600 * 1000).toISOString()]
  )?.c ?? 0) as number;
  const failedLogins = (rawGet(
    "SELECT COUNT(*) as c FROM AuditLog WHERE action = 'LOGIN_FALHA' AND createdAt >= ?",
    [new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()]
  )?.c ?? 0) as number;

  return { total, last24h, failedLogins };
}

/**
 * Remove entradas antigas.
 *
 * A política publicada guarda a trilha por 6 meses; manter além disso
 * acumularia dado pessoal sem finalidade, o que a própria LGPD desaconselha.
 */
export function pruneAuditLog(days = 180): number {
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const before = (rawGet("SELECT COUNT(*) as c FROM AuditLog WHERE createdAt < ?", [cutoff])?.c ??
    0) as number;
  if (before > 0) {
    rawAll("DELETE FROM AuditLog WHERE createdAt < ?", [cutoff]);
  }
  return before;
}
