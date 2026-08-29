"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, ScrollText, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { ENTITIES } from "@/lib/entities";
import { getIcon } from "@/lib/icon-map";
import { BrandMascot } from "./BrandMark";

const EXTRA_LINKS = [
  { href: "/lgpd", label: "Direitos do titular", icon: ShieldCheck },
  { href: "/auditoria", label: "Auditoria de acesso", icon: ScrollText },
];

const GROUPS: { label: string; items: string[] }[] = [
  { label: "Atendimento", items: ["pacientes", "responsaveis", "profissionais", "sessoes"] },
  { label: "CRM & Relacionamento", items: ["leads", "interacoes", "lista-espera", "tarefas"] },
  { label: "Financeiro", items: ["financeiro", "convenios", "servicos"] },
  { label: "Outros", items: ["documentos", "satisfacao"] },
  { label: "Administração", items: ["unidades"] },
];

export default function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

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
        <Link
          href="/dashboard"
          className={`mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/dashboard" ? "bg-gold-500 text-navy-900" : "text-teal-50 hover:bg-white/10"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((key) => {
                const entity = ENTITIES[key];
                if (!entity) return null;
                const Icon = getIcon(entity.icon);
                const active = pathname?.startsWith(`/${key}`);
                return (
                  <Link
                    key={key}
                    href={`/${key}`}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-gold-500 text-navy-900" : "text-teal-50 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {entity.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mb-4">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
            Proteção de dados
          </p>
          <div className="space-y-1">
            {EXTRA_LINKS.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-gold-500 text-navy-900" : "text-teal-50 hover:bg-white/10"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="mb-2 truncate text-xs text-teal-200">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-coral-200 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
