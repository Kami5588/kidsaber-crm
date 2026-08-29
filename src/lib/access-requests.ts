import { insertRow, rawAll, rawGet, updateRow } from "./orm";

/**
 * Pedidos de acesso vindos do login com Google.
 *
 * Entrar com a conta Google não dá acesso a nada: cria um pedido que a direção
 * precisa aprovar, definindo perfil e vínculo. É o que impede que qualquer
 * pessoa com um e-mail chegue perto de um prontuário só por ter clicado em
 * "entrar com Google".
 */

export type AccessStatus = "PENDENTE" | "APROVADO" | "RECUSADO";

export interface AccessRequestRow {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: AccessStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  note: string | null;
  createdAt: string;
}

/**
 * Registra (ou atualiza) o pedido de quem tentou entrar sem ter conta.
 *
 * Um pedido já recusado volta para pendente numa nova tentativa: a pessoa pode
 * ter sido recusada por engano, e a direção decide de novo.
 */
export function recordAccessRequest(input: {
  email: string;
  name?: string | null;
  picture?: string | null;
}): void {
  const email = input.email.trim().toLowerCase();
  const existing = rawGet("SELECT * FROM AccessRequest WHERE lower(email) = ?", [email]);

  if (existing) {
    if (existing.status === "PENDENTE") return;
    updateRow("AccessRequest", existing.id, {
      status: "PENDENTE",
      name: input.name ?? existing.name,
      picture: input.picture ?? existing.picture,
      reviewedById: null,
      reviewedByName: null,
      reviewedAt: null,
    });
    return;
  }

  insertRow("AccessRequest", {
    email,
    name: input.name ?? null,
    picture: input.picture ?? null,
    status: "PENDENTE",
  });
}

export function listAccessRequests(status?: AccessStatus): AccessRequestRow[] {
  if (status) {
    return rawAll(
      "SELECT * FROM AccessRequest WHERE status = ? ORDER BY createdAt DESC",
      [status]
    ) as AccessRequestRow[];
  }
  return rawAll(
    "SELECT * FROM AccessRequest ORDER BY (status = 'PENDENTE') DESC, createdAt DESC"
  ) as AccessRequestRow[];
}

export function pendingAccessCount(): number {
  return (rawGet("SELECT COUNT(*) as c FROM AccessRequest WHERE status = 'PENDENTE'")?.c ??
    0) as number;
}

export function getAccessRequest(id: string): AccessRequestRow | undefined {
  return rawGet("SELECT * FROM AccessRequest WHERE id = ?", [id]) as AccessRequestRow | undefined;
}

export function markReviewed(
  id: string,
  status: AccessStatus,
  reviewer: { id: string; name: string },
  note?: string | null
): void {
  updateRow("AccessRequest", id, {
    status,
    reviewedById: reviewer.id,
    reviewedByName: reviewer.name,
    reviewedAt: new Date().toISOString(),
    note: note ?? null,
  });
}
