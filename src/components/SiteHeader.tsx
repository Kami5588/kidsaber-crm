import Link from "next/link";

/**
 * Cabeçalho das páginas públicas.
 *
 * `anchors` fica ligado só na landing, onde as âncoras (#especialidades etc.)
 * existem na própria página; nas páginas legais os links viram rotas para a raiz.
 */
export default function SiteHeader({
  isLoggedIn,
  anchors = true,
}: {
  isLoggedIn: boolean;
  anchors?: boolean;
}) {
  const href = (hash: string) => (anchors ? hash : `/${hash}`);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-lg font-extrabold text-navy-900">
            KS
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight text-navy-800">Clínica KidSaber</span>
            <span className="block text-xs leading-tight text-teal-600">Desenvolvimento infantil</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href={href("#especialidades")} className="transition hover:text-navy-700">Especialidades</a>
          <a href={href("#como-funciona")} className="transition hover:text-navy-700">Como funciona</a>
          <a href={href("#unidades")} className="transition hover:text-navy-700">Unidades</a>
          <a href={href("#contato")} className="transition hover:text-navy-700">Contato</a>
        </nav>

        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-navy-700 transition hover:bg-slate-50"
        >
          {isLoggedIn ? "Ir para o painel" : "Área restrita"}
        </Link>
      </div>
    </header>
  );
}
