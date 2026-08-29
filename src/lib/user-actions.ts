"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "./audit";
import { getCurrentUser, type Role } from "./permissions";
import { getAccessRequest, markReviewed } from "./access-requests";
import {
  countActiveAdmins,
  createUser,
  generatePassword,
  getUserByEmail,
  getUserById,
  setPassword,
  updateUser,
  verifyPassword,
} from "./users";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  if (user.role !== "ADMIN") throw new Error("Apenas administradores gerenciam contas de acesso.");
  return user;
}

const ROLE_VALUES = ["ADMIN", "PROFISSIONAL", "RECEPCAO"] as const;

const userSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(160),
  role: z.enum(ROLE_VALUES),
  professionalId: z.string().trim().max(64).optional(),
  title: z.string().trim().max(30).optional(),
  jobTitle: z.string().trim().max(60).optional(),
});

export type UserFormState = {
  ok: boolean;
  error?: string;
  message?: string;
  /** Mostrada uma única vez, logo após criar a conta ou redefinir a senha. */
  password?: string;
};

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    await requireAdmin();

    const parsed = userSchema.safeParse({
      name: formData.get("name") ?? "",
      email: formData.get("email") ?? "",
      role: formData.get("role") ?? "PROFISSIONAL",
      professionalId: formData.get("professionalId") ?? "",
      title: formData.get("title") ?? "",
      jobTitle: formData.get("jobTitle") ?? "",
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
    }

    const d = parsed.data;

    // Um profissional que não aponta para nenhum cadastro não enxergaria
    // paciente algum — melhor barrar na criação do que entregar uma conta cega.
    if (d.role === "PROFISSIONAL" && !d.professionalId) {
      return {
        ok: false,
        error: "Vincule a conta a um profissional: é esse vínculo que define quais pacientes ela vê.",
      };
    }

    const password = generatePassword();
    const id = createUser({
      name: d.name,
      email: d.email,
      password,
      role: d.role as Role,
      professionalId: d.professionalId || null,
      title: d.title || null,
      jobTitle: d.jobTitle || null,
      mustChangePassword: true,
    });

    await logAccess({
      action: "CRIAR",
      entity: "User",
      entityId: id,
      detail: `Conta criada para ${d.email} com perfil ${d.role}.`,
    });

    revalidatePath("/usuarios");
    return {
      ok: true,
      password,
      message: `Conta de ${d.name} criada. Anote a senha abaixo: ela não será mostrada de novo.`,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível criar a conta." };
  }
}

export async function updateUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const target = getUserById(id);
    if (!target) return { ok: false, error: "Conta não encontrada." };

    const role = String(formData.get("role") ?? target.role) as Role;
    const active = formData.get("active") === "on";
    const professionalId = String(formData.get("professionalId") ?? "");

    // Rebaixar ou desativar o último administrador deixaria a clínica sem quem
    // gerencie o sistema, sem caminho de volta pela interface.
    const losingAdmin = target.role === "ADMIN" && (role !== "ADMIN" || !active);
    if (losingAdmin && countActiveAdmins(id) === 0) {
      return {
        ok: false,
        error: "Esta é a única conta de administrador ativa. Promova outra antes de alterar esta.",
      };
    }

    if (role === "PROFISSIONAL" && !professionalId) {
      return { ok: false, error: "Contas de profissional precisam estar vinculadas a um cadastro." };
    }

    updateUser(id, {
      name: String(formData.get("name") ?? target.name),
      role,
      professionalId: professionalId || null,
      title: String(formData.get("title") ?? ""),
      jobTitle: String(formData.get("jobTitle") ?? ""),
      active,
    });

    await logAccess({
      action: "EDITAR",
      entity: "User",
      entityId: id,
      detail: `Conta ${target.email} alterada por ${admin.email}. Perfil: ${role}. Ativa: ${active}.`,
    });

    revalidatePath("/usuarios");
    return { ok: true, message: "Conta atualizada." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível atualizar a conta." };
  }
}

export async function resetPasswordAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const target = getUserById(id);
    if (!target) return { ok: false, error: "Conta não encontrada." };

    const password = generatePassword();
    setPassword(id, password, true);

    await logAccess({
      action: "EDITAR",
      entity: "User",
      entityId: id,
      detail: `Senha redefinida para ${target.email} por ${admin.email}.`,
    });

    revalidatePath("/usuarios");
    return {
      ok: true,
      password,
      message: `Nova senha de ${target.name}. Entregue à pessoa e peça que troque no primeiro acesso.`,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível redefinir a senha." };
  }
}

const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres.")
  .max(100);

export async function changeOwnPasswordAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

    const current = String(formData.get("currentPassword") ?? "");
    const next = String(formData.get("newPassword") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (!verifyPassword(user.id, current)) {
      return { ok: false, error: "A senha atual está incorreta." };
    }

    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Senha inválida." };
    }
    if (next !== confirm) return { ok: false, error: "A confirmação não confere com a nova senha." };
    if (next === current) return { ok: false, error: "A nova senha precisa ser diferente da atual." };

    setPassword(user.id, next, false);

    await logAccess({
      action: "EDITAR",
      entity: "User",
      entityId: user.id,
      detail: "Senha alterada pelo próprio usuário.",
    });

    revalidatePath("/minha-conta");
    return { ok: true, message: "Senha alterada com sucesso." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível alterar a senha." };
  }
}

/* -------------------------------------------------------------------------
 * Pedidos de acesso vindos do login com Google
 * ---------------------------------------------------------------------- */

/**
 * Libera o acesso de quem entrou com Google, criando a conta com o perfil que
 * a direção escolher. Sem senha: a pessoa continua entrando pelo Google.
 */
export async function approveAccessAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const admin = await requireAdmin();

    const requestId = String(formData.get("requestId") ?? "");
    const request = getAccessRequest(requestId);
    if (!request) return { ok: false, error: "Pedido não encontrado." };
    if (request.status === "APROVADO") return { ok: false, error: "Este pedido já foi aprovado." };

    const role = String(formData.get("role") ?? "PROFISSIONAL") as Role;
    const professionalId = String(formData.get("professionalId") ?? "");
    const name = String(formData.get("name") ?? request.name ?? request.email).trim();

    if (role === "PROFISSIONAL" && !professionalId) {
      return {
        ok: false,
        error: "Vincule a conta a um profissional: é esse vínculo que define quais pacientes ela vê.",
      };
    }

    if (getUserByEmail(request.email)) {
      markReviewed(requestId, "APROVADO", { id: admin.id, name: admin.displayName });
      return { ok: false, error: "Já existe uma conta com este e-mail. O pedido foi encerrado." };
    }

    // Senha aleatória que ninguém usa: quem entra pelo Google não passa pelo
    // formulário de senha. Deixar o campo vazio abriria uma conta sem
    // credencial nenhuma.
    const id = createUser({
      name,
      email: request.email,
      password: generatePassword(),
      role,
      professionalId: professionalId || null,
      title: String(formData.get("title") ?? "") || null,
      jobTitle: String(formData.get("jobTitle") ?? "") || null,
      mustChangePassword: false,
    });

    markReviewed(requestId, "APROVADO", { id: admin.id, name: admin.displayName });

    await logAccess({
      action: "CRIAR",
      entity: "User",
      entityId: id,
      detail: `Acesso liberado para ${request.email} com perfil ${role}, a partir do login com Google.`,
    });

    revalidatePath("/usuarios");
    return { ok: true, message: `Acesso liberado para ${name}. Ela já pode entrar com o Google.` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível liberar o acesso." };
  }
}

/** Recusa o pedido. A pessoa pode tentar de novo, e o pedido volta à fila. */
export async function rejectAccessAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const admin = await requireAdmin();

    const requestId = String(formData.get("requestId") ?? "");
    const request = getAccessRequest(requestId);
    if (!request) return { ok: false, error: "Pedido não encontrado." };

    markReviewed(
      requestId,
      "RECUSADO",
      { id: admin.id, name: admin.displayName },
      String(formData.get("note") ?? "") || null
    );

    await logAccess({
      action: "EDITAR",
      entity: "AccessRequest",
      entityId: requestId,
      detail: `Pedido de acesso de ${request.email} recusado.`,
    });

    revalidatePath("/usuarios");
    return { ok: true, message: `Pedido de ${request.email} recusado.` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Não foi possível recusar o pedido." };
  }
}
