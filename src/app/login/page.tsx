import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users2, ClipboardCheck } from "lucide-react";
import { googleEnabled } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandMark";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Entrar · KidSaber Connect",
  description: "Acesso restrito à equipe da Clínica KidSaber.",
};

const HIGHLIGHTS = [
  { icon: Users2, text: "Cada profissional vê apenas os pacientes que atende" },
  { icon: ClipboardCheck, text: "Evolução, laudos e encaminhamentos no mesmo lugar" },
  { icon: ShieldCheck, text: "Dados de saúde criptografados e acessos auditados" },
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ---------- Painel da marca ---------- */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-brand-hero px-8 py-10 lg:w-[46%] lg:px-14 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 24rem at 90% 0%, rgba(41,171,226,.35), transparent 62%), radial-gradient(32rem 22rem at 0% 100%, rgba(252,209,22,.18), transparent 60%)",
          }}
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-200 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </div>

        <div className="relative my-10 flex flex-col items-center text-center lg:my-0">
          {/* A logo fica sobre fundo branco: o "S" do nome é azul-escuro e
              desaparece quando aplicado direto sobre o azul da marca. */}
          <span className="inline-flex items-center justify-center rounded-3xl bg-white p-5 shadow-2xl">
            <BrandLogo priority width={320} height={320} className="h-auto w-40 sm:w-48" />
          </span>

          <h1 className="mt-8 text-3xl font-extrabold text-white sm:text-4xl">
            KidSaber Connect
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-teal-50/85">
            O sistema de gestão da Clínica KidSaber: agenda, prontuário, laudos e acompanhamento
            das três unidades.
          </p>
        </div>

        <ul className="relative space-y-3">
          {HIGHLIGHTS.map((h) => (
            <li key={h.text} className="flex items-start gap-3 text-sm text-teal-50/85">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <h.icon className="h-4 w-4 text-gold-400" />
              </span>
              {h.text}
            </li>
          ))}
        </ul>
      </aside>

      {/* ---------- Formulário ---------- */}
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
        <LoginForm googleEnabled={googleEnabled} initialError={searchParams.error} />
      </main>
    </div>
  );
}
