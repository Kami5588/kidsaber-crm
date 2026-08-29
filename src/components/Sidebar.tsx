"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, LogOut, ScrollText, ShieldCheck, UserCog, HeartHandshake,
  KeyRound, LifeBuoy, CalendarDays, Menu, X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ENTITIES } from "@/lib/entities";
import { getIcon } from "@/lib/icon-map";
import { canAccessEntity, canAccessPage, type Role } from "@/lib/roles";
import { SUPPORT_EMAIL } from "@/lib/clinic";
import { BrandMascot } from "./BrandMark";

const GROUPS: { label: string; items: string[] }[] = [
  { label: "Atendimento", items: ["pacientes", "responsaveis", "profissionais", "sessoes"] },
  { label: "CRM & Relacionamento", items: ["leads", "interacoes", "lista-espera", "tarefas"] },
  { label: "Financeiro", items: ["financeiro", "convenios", "servicos"] },
  { label: "Outros", items: ["documentos", "satisfacao"] },
  { label: "Administração", items: ["unidades"] },
];

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
  const [open, setOpen] = useState(false);

  // Navegar fecha o menu: no celular ele cobre a tela inteira e ficaria por
  // cima da página recém-aberta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Com o menu aberto, travar o fundo evita a página rolar por trás dele.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active ? "bg-gold-500 text-navy-900" : "text-teal-50 hover:bg-white/10"
    }`;

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((key) => ENTITIES[key] && canAccessEntity(role, key)),
  })).filter((g) => g.items.length > 0);

  const visibleExtras = EXTRA_LINKS.filter((l) => canAccessPage(role, l.href));
  const showDashboard = canAccessPage(role, "/dashboard");
  const showMyPatients = visibleExtras.some((l) => l.href === "/meus-pacientes");
  const protecao = visibleExtras.filter((l) => l.href !== "/meus-pacientes");

  return (
    <>
      {/* Botão do menu, só no celular */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        // z-50 para ficar acima do cabeçalho, que usa z-40; a barra lateral entra
        // depois no DOM e cobre o botão quando abre.
        className="fixed left-4 top-3.5 z-50 rounded-xl bg-brand-hero p-2.5 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Fundo escurecido enquanto o menu está aberto */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-shrink-0 flex-col bg-brand-hero text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <BrandMascot className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold leading-tight">KidSaber</p>
            <p className="text-xs leading-tight text-teal-200">Connect CRM</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-teal-100 transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {showDashboard && (
            <Link href="/dashboard" className={`mb-2 ${linkClass(pathname === "/dashboard")}`}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}

          {showMyPatients && (
            <Link
              href="/meus-pacientes"
              className={`mb-2 ${linkClass(pathname?.startsWith("/meus-pacientes") ?? false)}`}
            >
              <HeartHandshake className="h-4 w-4" />
              Meus pacientes
            </Link>
          )}

          <Link
            href="/agenda"
            className={`mb-4 ${linkClass(pathname?.startsWith("/agenda") ?? false)}`}
          >
            <CalendarDays className="h-4 w-4" />
            Agenda
          </Link>

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

          {protecao.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/80">
                Proteção de dados
              </p>
              <div className="space-y-1">
                {protecao.map((l) => (
                  <Link key={l.href} href={l.href} className={linkClass(pathname?.startsWith(l.href) ?? false)}>
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
    </>
  );
}
