import bcrypt from "bcryptjs";
import { insertRow, rawAll, rawGet, updateRow } from "./orm";
import { buildDisplayName, type Role } from "./roles";

/**
 * Contas de acesso ao sistema.
 *
 * Um usuário pode estar vinculado a um cadastro de Professional: é esse vínculo
 * que define quais pacientes ele enxerga.
 */

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  professionalId: string | null;
  title: string | null;
  jobTitle: string | null;
  active: number;
  mustChangePassword: number;
  createdAt: string;
  displayName?: string;
  professionalName?: string | null;
  specialty?: string | null;
}

/** Tratamentos sugeridos. A clínica pode digitar outro, se preferir. */
export const TITLE_OPTIONS = ["Dra.", "Dr.", "Prof.ª", "Prof.", "Esp.", "Me.", "Sr.ª", "Sr."];

/** Cargos sugeridos, alinhados às especialidades atendidas. */
export const JOB_TITLE_OPTIONS = [
  "Analista do Comportamento (ABA)",
  "Terapeuta ESDM",
  "Terapeuta Ocupacional",
  "Fonoaudióloga",
  "Fonoaudiólogo",
  "Psicopedagoga",
  "Psicopedagogo",
  "Psicóloga",
  "Psicólogo",
  "Coordenadora",
  "Coordenador",
  "Recepcionista",
  "Administradora",
  "Administrador",
];

export function listUsers(): UserRow[] {
  const rows = rawAll(
    `SELECT u.*, p.fullName AS professionalName, p.specialty
     FROM User u
     LEFT JOIN Professional p ON p.id = u.professionalId
     ORDER BY u.active DESC, u.name ASC`
  ) as UserRow[];

  return rows.map((u) => ({
    ...u,
    displayName: buildDisplayName(u.name, u.title, u.jobTitle),
  }));
}

export function getUserByEmail(email: string): UserRow | undefined {
  return rawGet("SELECT * FROM User WHERE lower(email) = ?", [email.trim().toLowerCase()]) as
    | UserRow
    | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return rawGet("SELECT * FROM User WHERE id = ?", [id]) as UserRow | undefined;
}

/** Profissionais ainda sem conta, para o campo de vínculo. */
export function listLinkableProfessionals(currentUserId?: string) {
  return rawAll(
    `SELECT p.id, p.fullName, p.specialty
     FROM Professional p
     WHERE p.status = 'Ativo'
       AND (
         p.id NOT IN (SELECT professionalId FROM User WHERE professionalId IS NOT NULL)
         OR p.id = (SELECT professionalId FROM User WHERE id = ?)
       )
     ORDER BY p.fullName ASC`,
    [currentUserId ?? ""]
  );
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  professionalId?: string | null;
  title?: string | null;
  jobTitle?: string | null;
  unitId?: string | null;
  mustChangePassword?: boolean;
}

export function createUser(input: CreateUserInput): string {
  const email = input.email.trim().toLowerCase();

  if (getUserByEmail(email)) {
    throw new Error("Já existe uma conta com este e-mail.");
  }

  return insertRow(
    "User",
    {
      name: input.name.trim(),
      email,
      passwordHash: bcrypt.hashSync(input.password, 10),
      role: input.role,
      professionalId: input.professionalId || null,
      title: input.title || null,
      jobTitle: input.jobTitle || null,
      unitId: input.unitId || null,
      active: 1,
      mustChangePassword: input.mustChangePassword === false ? 0 : 1,
    },
    { withTimestamps: true }
  );
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  professionalId?: string | null;
  title?: string | null;
  jobTitle?: string | null;
  active?: boolean;
}

export function updateUser(id: string, input: UpdateUserInput): void {
  const payload: Record<string, any> = {};

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.role !== undefined) payload.role = input.role;
  if (input.professionalId !== undefined) payload.professionalId = input.professionalId || null;
  if (input.title !== undefined) payload.title = input.title || null;
  if (input.jobTitle !== undefined) payload.jobTitle = input.jobTitle || null;
  if (input.active !== undefined) payload.active = input.active ? 1 : 0;

  if (Object.keys(payload).length === 0) return;
  updateRow("User", id, payload);
}

export function setPassword(id: string, password: string, mustChange = true): void {
  updateRow("User", id, {
    passwordHash: bcrypt.hashSync(password, 10),
    mustChangePassword: mustChange ? 1 : 0,
  });
}

export function verifyPassword(id: string, password: string): boolean {
  const row = rawGet("SELECT passwordHash FROM User WHERE id = ?", [id]);
  if (!row) return false;
  return bcrypt.compareSync(password, row.passwordHash);
}

/** Quantidade de administradores ativos, usada para impedir ficar sem nenhum. */
export function countActiveAdmins(excludeId?: string): number {
  return (rawGet(
    `SELECT COUNT(*) as c FROM User WHERE role = 'ADMIN' AND active = 1 AND id != ?`,
    [excludeId ?? ""]
  )?.c ?? 0) as number;
}

/** Gera uma senha inicial legível para ditar por telefone, mas ainda forte. */
export function generatePassword(): string {
  // Sem caracteres ambíguos (O/0, l/1) para não gerar confusão ao digitar.
  const letters = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = letters + upper + digits + symbols;

  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

  const chars = [pick(upper), pick(letters), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(all));

  // Embaralha para os tipos obrigatórios não ficarem sempre nas mesmas posições.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
