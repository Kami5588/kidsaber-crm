"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { BrandLockup } from "./BrandMark";
import { WHATSAPP_URL } from "@/lib/clinic";

const LINKS = [
  { hash: "#especialidades", label: "Especialidades" },
  { hash: "#como-funciona", label: "Como funciona" },
  { hash: "#unidades", label: "Unidades" },
  { hash: "#contato", label: "Contato" },
  { hash: "#acesso", label: "Acesso" },
];

/**
 * Cabeçalho das páginas públicas.
 *
 * `anchors` fica ligado só na landing, onde as âncoras existem na própria
 * página; nas páginas legais os links viram rotas para a raiz.
 */
export default function SiteHeader({
  isLoggedIn,
  anchors = true,
}: {
  isLoggedIn: boolean;
  anchors?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // A barra ganha sombra assim que a página sai do topo.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = (hash: string) => (anchors ? hash : `/${hash}`);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition ${
        scrolled ? "border-navy-100 shadow-sm" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="transition hover:opacity-90">
          <BrandLockup />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.hash}
              href={href(l.hash)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-navy-50 hover:text-navy-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-brand-sun px-4 py-2.5 text-sm font-bold text-navy-900 shadow-sm transition hover:brightness-105 sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>

          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="hidden rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50 md:inline-flex"
          >
            {isLoggedIn ? "Painel" : "Área restrita"}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="rounded-xl border border-navy-200 p-2.5 text-navy-700 transition hover:bg-navy-50 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {LINKS.map((l) => (
              <a
                key={l.hash}
                href={href(l.hash)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-navy-50"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
            >
              {isLoggedIn ? "Ir para o painel" : "Área restrita"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
