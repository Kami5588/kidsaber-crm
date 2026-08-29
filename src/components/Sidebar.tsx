"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, LogOut, ScrollText, ShieldCheck, UserCog, HeartHandshake, KeyRound, LifeBuoy,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ENTITIES } from "@/lib/entities";
import { getIcon } from "@/lib/icon-map";
import { canAccessEntity, canAccessPage, type Role } from "@/lib/roles";
import { BrandMascot } from "./BrandMark";
import { SUPPORT_EMAIL } from "@/lib/clinic";

const GROUPS: { label: string; items: string[] }[] = [
  { label: "Atendimento", items: ["pacientes", "responsaveis", "profissionais", "sessoes"] },
  { label: "CRM & Relacionamento", items: ["leads", "interacoes", "lista-espera", "tarefas"] },
  { label: "Financeiro", items: ["financeiro", "convenios", "servicos"] },
  { label: "Outros", items: ["documentos", "satisfacao"] },
  { label: "Administração", items: ["unidades"] },
];

/** Páginas próprias, fora do CRUD genérico. */
const EXTRA_LINKS = [
  { href: "/meus-pacientes", label: "Meus pacientes", icon: HeartHandshake },
  { href: "/usuarios", label: "Contas de acesso", icon: UserCog },
  { href: "/lgpd", label: "Direitos do titular", icon: ShieldCheck },
  { href: "/auditoria", label: "Auditoria de acesso", icon: ScrollText },
];

export default function Sidebar({
  userName,
  role,
  jobTitle,
}: {
  userName?: string | null;
  role: Role;
  jobTitle?: string | null;
}) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active ? "bg-gold-500 text-navy-900" : "text-teal-50 hover:bg-white/10"
    }`;

  // Cada grupo mostra só o que o perfil pode abrir; grupo que fica vazio some.
  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((key) => ENTITIES[key] && canAccessEntity(role, key)),
  })).filter((g) => g.items.length > 0);

  const visibleExtras = EXTRA_LINKS.filter((l) => canAccessPage(role, l.href));
  const showDashboard = canAccessPage(role, "/dashboard");

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-brand-hero text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <BrandMascot className="h-11 w-11" />
        <div>
          <p className="text-sm font-extrabold leading-tight">KidSaber</p>
          <p className="text-xs leading-tight text-teal-200">Connect CRM</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {showDashboard && (
          <Link href="/dashboard" className={`mb-4 ${linkClass(pathname === "/dashboard")}`}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        )}

        {visibleExtras.some((l) => l.href === "/meus-pacientes") && (
          <Link
            href="/meus-pacientes"
            className={`mb-4 ${linkClass(pathname?.startsWith("/meus-pacientes") ?? false)}`}
          >
            <HeartHandshake className="h-4 w-4" />
            Meus pacientes
          </Link>
        )}

        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((key) => {
                const entity = ENTITIES[key];
                const Icon = getIcon(entity.icon);
                return (
                  <Link
                    key={key}
                    href={`/${key}`}
                    className={linkClass(pathname?.startsWith(`/${key}`) ?? false)}
                  >
                    <Icon className="h-4 w-4" />
                    {entity.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {visibleExtras.some((l) => l.href !== "/meus-pacientes") && (
          <div className="mb-4">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
              Proteção de dados
            </p>
            <div className="space-y-1">
              {visibleExtras
                .filter((l) => l.href !== "/meus-pacientes")
                .map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={linkClass(pathname?.startsWith(l.href) ?? false)}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-semibold text-white">{userName}</p>
        {jobTitle && <p className="mb-2 truncate text-xs text-teal-200">{jobTitle}</p>}

        <Link
          href="/minha-conta"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-teal-50 transition hover:bg-white/10"
        >
          <KeyRound className="h-4 w-4" />
          Minha conta
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Suporte KidSaber Connect")}`}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-teal-50 transition hover:bg-white/10"
        >
          <LifeBuoy className="h-4 w-4" />
          Suporte
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-coral-200 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
