import { insertRow, rawAll, rawGet } from "./orm";

/**
 * Proteção contra força bruta no login.
 *
 * As tentativas ficam em tabela, e não em memória, para que um reinício do
 * container não zere o contador e devolva ao atacante as tentativas gastas.
 */

export const MAX_ATTEMPTS = 5;
export const WINDOW_MINUTES = 15;

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

/** Normaliza o identificador para não criar contadores diferentes por caixa. */
function normalize(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export interface LoginGuardResult {
  allowed: boolean;
  attemptsLeft: number;
  /** Minutos até liberar, quando bloqueado. */
  retryInMinutes: number;
}

export function checkLogin(identifier: string): LoginGuardResult {
  const failures = (rawGet(
    `SELECT COUNT(*) as c FROM LoginAttempt
     WHERE identifier = ? AND success = 0 AND createdAt >= ?`,
    [normalize(identifier), windowStart()]
  )?.c ?? 0) as number;

  if (failures >= MAX_ATTEMPTS) {
    const oldest = rawGet(
      `SELECT createdAt FROM LoginAttempt
       WHERE identifier = ? AND success = 0 AND createdAt >= ?
       ORDER BY createdAt ASC LIMIT 1`,
      [normalize(identifier), windowStart()]
    );

    const freeAt = oldest
      ? new Date(new Date(oldest.createdAt).getTime() + WINDOW_MINUTES * 60 * 1000)
      : new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

    return {
      allowed: false,
      attemptsLeft: 0,
      retryInMinutes: Math.max(1, Math.ceil((freeAt.getTime() - Date.now()) / 60000)),
    };
  }

  return {
    allowed: true,
    attemptsLeft: MAX_ATTEMPTS - failures,
    retryInMinutes: 0,
  };
}

export function recordAttempt(identifier: string, success: boolean): void {
  insertRow("LoginAttempt", {
    identifier: normalize(identifier),
    success: success ? 1 : 0,
  });

  // Entrada bem-sucedida zera o histórico de falhas: quem provou a identidade
  // não deve continuar carregando o contador de bloqueio.
  if (success) {
    rawAll(`DELETE FROM LoginAttempt WHERE identifier = ? AND success = 0`, [
      normalize(identifier),
    ]);
  }
}

/** Descarta registros fora da janela, para a tabela não crescer sem limite. */
export function pruneLoginAttempts(): void {
  rawAll(`DELETE FROM LoginAttempt WHERE createdAt < ?`, [
    new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  ]);
}
