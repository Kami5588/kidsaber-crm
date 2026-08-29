import Link from "next/link";

export default function SiteFooter({ anchors = true }: { anchors?: boolean }) {
  const href = (hash: string) => (anchors ? hash : `/${hash}`);

  return (
    <footer className="bg-navy-800 py-12 text-teal-100/80">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-lg font-extrabold text-navy-900">
              KS
            </span>
            <span>
              <span className="block text-sm font-bold text-white">Clínica KidSaber</span>
              <span className="block text-xs">Desenvolvimento infantil</span>
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href={href("#especialidades")} className="transition hover:text-white">Especialidades</a>
            <a href={href("#unidades")} className="transition hover:text-white">Unidades</a>
            <a href={href("#contato")} className="transition hover:text-white">Contato</a>
            <Link href="/privacidade" className="transition hover:text-white">Privacidade</Link>
            <Link href="/termos" className="transition hover:text-white">Termos de uso</Link>
            <Link href="/login" className="transition hover:text-white">Área restrita</Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} Clínica KidSaber. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
