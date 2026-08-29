import Link from "next/link";
import { Home, LogIn, SearchX } from "lucide-react";
import { BrandLogo } from "@/components/BrandMark";

export const metadata = { title: "Página não encontrada · KidSaber" };

/**
 * Página 404.
 *
 * Vale a pena existir: o `notFound()` também é o que devolvemos quando alguém
 * tenta abrir uma área sem permissão. Uma tela acolhedora evita que a pessoa
 * ache que o sistema quebrou.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <span className="inline-flex items-center justify-center rounded-3xl bg-white p-4 shadow-lg">
          <BrandLogo width={200} height={200} className="h-auto w-24" />
        </span>

        <span className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-100 text-navy-600 mx-auto">
          <SearchX className="h-7 w-7" />
        </span>

        <h1 className="mt-6 text-3xl font-extrabold text-navy-800">
          Não encontramos esta página
        </h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          O endereço pode ter mudado, ou você não tem acesso a esta área do sistema. Se acredita
          que deveria ter, fale com a administração da clínica.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" /> Ir para o site
          </Link>
          <Link href="/login" className="btn-secondary">
            <LogIn className="h-4 w-4" /> Entrar no sistema
          </Link>
        </div>
      </div>
    </div>
  );
}
