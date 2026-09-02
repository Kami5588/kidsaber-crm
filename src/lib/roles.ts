/**
 * Perfis de acesso e regras de visibilidade, sem dependência de servidor.
 *
 * Ficam separados de permissions.ts porque o menu roda no navegador e aquele
 * módulo puxa sessão e banco, que não existem no cliente.
 *
 * A regra que orienta tudo: profissional enxerga apenas os pacientes que
 * atende. Numa clínica, o prontuário de uma criança não é assunto de quem não
 * participa daquele acompanhamento — e a LGPD trata isso como acesso indevido
 * a dado sensível, não como detalhe de conveniência.
 */
export type Role = "ADMIN" | "PROFISSIONAL" | "RECEPCAO";

export const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acesso total, incluindo financeiro, contas, auditoria e proteção de dados.",
  },
  {
    value: "PROFISSIONAL",
    label: "Profissional",
    description: "Vê apenas os próprios pacientes, suas sessões e os documentos compartilhados.",
  },
  {
    value: "RECEPCAO",
    label: "Recepção",
    description: "Agenda, cadastros, contatos e financeiro. Não acessa evolução clínica.",
  },
];

/** Áreas liberadas por perfil, usando as chaves de ENTITIES. */
const ENTITY_ACCESS: Record<Role, string[] | "*"> = {
  ADMIN: "*",
  PROFISSIONAL: ["pacientes", "sessoes", "documentos", "tarefas", "satisfacao"],
  RECEPCAO: [
    "pacientes",
    "responsaveis",
    "profissionais",
    "sessoes",
    "leads",
    "interacoes",
    "lista-espera",
    "tarefas",
    "financeiro",
    "convenios",
    "servicos",
  ],
};

/** Páginas fora do CRUD genérico, com acesso próprio. */
const PAGE_ACCESS: Record<string, Role[]> = {
  "/dashboard": ["ADMIN", "RECEPCAO"],
  "/meus-pacientes": ["PROFISSIONAL", "ADMIN"],
  "/relatorios": ["ADMIN", "RECEPCAO"],
  "/faltas": ["ADMIN", "RECEPCAO", "PROFISSIONAL"],
  "/usuarios": ["ADMIN"],
  "/auditoria": ["ADMIN"],
  "/lgpd": ["ADMIN"],
  "/unidades": ["ADMIN"],
  "/backup": ["ADMIN"],
};

export function canAccessEntity(role: Role, entityKey: string): boolean {
  const allowed = ENTITY_ACCESS[role];
  if (allowed === "*") return true;
  return allowed.includes(entityKey);
}

export function canAccessPage(role: Role, path: string): boolean {
  const allowed = PAGE_ACCESS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

/** Perfis que podem ver evolução clínica e notas internas. */
export function canSeeClinicalNotes(role: Role): boolean {
  return role === "ADMIN" || role === "PROFISSIONAL";
}

/** Monta o nome exibido a partir do tratamento escolhido para a pessoa. */
export function buildDisplayName(
  name: string,
  title?: string | null,
  jobTitle?: string | null
): string {
  const withTitle = title ? `${title} ${name}` : name;
  return jobTitle ? `${withTitle} · ${jobTitle}` : withTitle;
}
