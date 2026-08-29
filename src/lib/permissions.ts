import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { rawGet } from "./orm";
import {
  buildDisplayName, canAccessEntity, canAccessPage, canSeeClinicalNotes, ROLES, type Role,
} from "./roles";

/**
 * Camada de permissões que depende de sessão e banco.
 *
 * As regras puras (quem vê o quê) moram em roles.ts, para poderem ser usadas
 * também pelo menu, que roda no navegador.
 */
export { buildDisplayName, canAccessEntity, canAccessPage, canSeeClinicalNotes, ROLES };
export type { Role };

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  professionalId: string | null;
  title: string | null;
  jobTitle: string | null;
  /** Nome como deve aparecer nas telas, já com tratamento e cargo. */
  displayName: string;
}

/**
 * Usuário da requisição atual, com os dados de perfil vindos do banco.
 *
 * O papel é relido do banco a cada requisição, e não do token: assim, revogar
 * o acesso de alguém tem efeito imediato, sem esperar a sessão expirar.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const row = rawGet("SELECT * FROM User WHERE lower(email) = ?", [
    session.user.email.toLowerCase(),
  ]);
  if (!row) return null;
  if (row.active === 0) return null;

  const role = (row.role as Role) ?? "PROFISSIONAL";

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    professionalId: row.professionalId ?? null,
    title: row.title ?? null,
    jobTitle: row.jobTitle ?? null,
    displayName: buildDisplayName(row.name, row.title, row.jobTitle),
  };
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === "ADMIN";
}

/**
 * Fragmento SQL que limita a consulta aos pacientes do usuário.
 *
 * `alias` é o prefixo da tabela Patient na consulta. Para admin e recepção
 * devolve cláusula sempre verdadeira; para profissional, restringe aos
 * pacientes em que ele está vinculado.
 *
 * Um profissional sem cadastro vinculado não vê paciente nenhum — falha
 * fechada, que é o comportamento correto quando a configuração está incompleta.
 */
export function patientScope(
  user: CurrentUser | null,
  alias = "p"
): { sql: string; params: string[] } {
  if (!user) return { sql: "1=0", params: [] };
  if (user.role === "ADMIN" || user.role === "RECEPCAO") return { sql: "1=1", params: [] };

  if (!user.professionalId) return { sql: "1=0", params: [] };

  return {
    sql: `${alias}.id IN (SELECT patientId FROM PatientProfessional WHERE professionalId = ?)`,
    params: [user.professionalId],
  };
}

/** Verifica se o usuário pode abrir a ficha de um paciente específico. */
export function canAccessPatient(user: CurrentUser | null, patientId: string): boolean {
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "RECEPCAO") return true;
  if (!user.professionalId) return false;

  const link = rawGet(
    "SELECT 1 as ok FROM PatientProfessional WHERE patientId = ? AND professionalId = ?",
    [patientId, user.professionalId]
  );
  return !!link;
}
