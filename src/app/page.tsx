import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  Brain, Ear, HandHeart, HeartPulse, Puzzle, BookOpen,
  MapPin, Phone, Mail, ArrowRight, CalendarCheck, ClipboardCheck, Users2, ShieldCheck,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listUnits } from "@/lib/units";
import { SPECIALTIES } from "@/lib/entities";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Clínica KidSaber · Desenvolvimento infantil com cuidado de verdade",
  description:
    "Fonoaudiologia, Psicologia, Terapia Ocupacional, Fisioterapia, Neurologia e Psicopedagogia para crianças. Unidades em Marechal Cândido Rondon, Guaíra e Mundo Novo.",
};

const SPECIALTY_ICONS: Record<string, any> = {
  Fonoaudiologia: Ear,
  Psicologia: Brain,
  "Terapia Ocupacional": HandHeart,
  Fisioterapia: HeartPulse,
  Neurologia: Puzzle,
  Psicopedagogia: BookOpen,
};

const SPECIALTY_TEXT: Record<string, string> = {
  Fonoaudiologia: "Linguagem, fala, audição e alimentação, com acompanhamento próximo da família.",
  Psicologia: "Apoio emocional e comportamental para a criança e orientação para os responsáveis.",
  "Terapia Ocupacional": "Autonomia nas atividades do dia a dia, coordenação e integração sensorial.",
  Fisioterapia: "Desenvolvimento motor, postura e equilíbrio em um ambiente lúdico e seguro.",
  Neurologia: "Avaliação e acompanhamento clínico do desenvolvimento neurológico infantil.",
  Psicopedagogia: "Apoio às dificuldades de aprendizagem, em parceria com a escola e a família.",
};

const STEPS = [
  {
    icon: Phone,
    title: "1. Primeiro contato",
    text: "Você fala com a nossa equipe pelo site ou WhatsApp e conta o que está buscando.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Avaliação inicial",
    text: "Agendamos uma avaliação com o profissional da especialidade indicada para o caso.",
  },
  {
    icon: CalendarCheck,
    title: "3. Plano de acompanhamento",
    text: "Montamos a rotina de sessões e você acompanha a evolução a cada etapa.",
  },
];

const DIFFERENTIALS = [
  {
    icon: Users2,
    title: "Equipe multidisciplinar",
    text: "Especialidades diferentes conversando entre si sobre o mesmo caso, não atendimentos isolados.",
  },
  {
    icon: ClipboardCheck,
    title: "Evolução registrada",
    text: "Cada sessão gera um registro de evolução, objetivos trabalhados e próximos passos.",
  },
  {
    icon: ShieldCheck,
    title: "Informação organizada",
    text: "Histórico, documentos e agendamentos centralizados em um sistema próprio da clínica.",
  },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const units = listUnits();

  return (
    <div className="bg-white">
      {/* ---------- Cabeçalho ---------- */}
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
            <a href="#especialidades" className="transition hover:text-navy-700">Especialidades</a>
            <a href="#como-funciona" className="transition hover:text-navy-700">Como funciona</a>
            <a href="#unidades" className="transition hover:text-navy-700">Unidades</a>
            <a href="#contato" className="transition hover:text-navy-700">Contato</a>
          </nav>

          <Link
            href={session ? "/dashboard" : "/login"}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-navy-700 transition hover:bg-slate-50"
          >
            {session ? "Ir para o painel" : "Área restrita"}
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section
        className="relative overflow-hidden bg-navy-800"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 85% -10%, rgba(44,177,199,0.25), transparent 60%), radial-gradient(50rem 30rem at 0% 110%, rgba(245,197,24,0.12), transparent 60%)",
        }}
      >

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200">
              <MapPin className="h-3.5 w-3.5" />
              {units.length} unidades no Paraná e Mato Grosso do Sul
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Cada criança tem o seu tempo.{" "}
              <span className="text-gold-400">A gente caminha junto.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-teal-50/90">
              Uma equipe multidisciplinar de fonoaudiologia, psicologia, terapia ocupacional,
              fisioterapia, neurologia e psicopedagogia — acompanhando o desenvolvimento infantil
              com atenção ao que cada família precisa.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contato" className="btn-gold">
                Agendar uma avaliação <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#especialidades"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Conhecer as especialidades
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {DIFFERENTIALS.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:last:col-span-2"
              >
                <d.icon className="h-7 w-7 text-gold-400" />
                <h3 className="mt-3 font-semibold text-white">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-teal-50/80">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Especialidades ---------- */}
      <section id="especialidades" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-teal-600">
            Especialidades
          </span>
          <h2 className="mt-3 text-3xl font-bold text-navy-800 sm:text-4xl">
            Um olhar completo sobre o desenvolvimento
          </h2>
          <p className="mt-4 text-slate-600">
            As especialidades atuam de forma integrada: o que é observado em uma sessão orienta o
            trabalho das outras áreas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALTIES.map((s) => {
            const Icon = SPECIALTY_ICONS[s] ?? Puzzle;
            return (
              <div
                key={s}
                className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy-800">{s}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {SPECIALTY_TEXT[s]}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section id="como-funciona" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-teal-600">
              Como funciona
            </span>
            <h2 className="mt-3 text-3xl font-bold text-navy-800 sm:text-4xl">
              Do primeiro contato ao acompanhamento
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-700 text-white">
                  <step.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy-800">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Unidades ---------- */}
      <section id="unidades" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-teal-600">Unidades</span>
          <h2 className="mt-3 text-3xl font-bold text-navy-800 sm:text-4xl">
            Perto de você
          </h2>
          <p className="mt-4 text-slate-600">
            Atendemos em {units.length} cidades, com a mesma equipe e o mesmo padrão de cuidado.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {units.map((u) => (
            <div key={u.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-navy-800">{u.name}</h3>
                {u.isMain ? (
                  <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gold-700">
                    Matriz
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">{u.city} · {u.state}</p>

              <div className="mt-5 space-y-2.5 text-sm text-slate-600">
                {u.address && (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                    <span>{u.address}</span>
                  </p>
                )}
                {u.phone && (
                  <p className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 flex-shrink-0 text-teal-600" />
                    <span>{u.phone}</span>
                  </p>
                )}
                {u.email && (
                  <p className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 flex-shrink-0 text-teal-600" />
                    <span className="break-all">{u.email}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Contato ---------- */}
      <section id="contato" className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-teal-600">Contato</span>
            <h2 className="mt-3 text-3xl font-bold text-navy-800 sm:text-4xl">
              Vamos conversar sobre o seu filho
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Preencha o formulário e nossa equipe entra em contato para entender o caso e orientar
              sobre o próximo passo. Se preferir, fale direto com a unidade mais próxima.
            </p>

            <div className="mt-8 space-y-4">
              {units.map((u) => (
                <div key={u.id} className="flex items-start gap-3 text-sm">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-navy-800">{u.name}</span>
                    <span className="block text-slate-500">{u.phone ?? "Telefone a confirmar"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <ContactForm
              units={units.map((u) => ({ id: u.id, name: u.name, city: u.city, state: u.state }))}
              specialties={SPECIALTIES}
            />
          </div>
        </div>
      </section>

      {/* ---------- Rodapé ---------- */}
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

            <nav className="flex flex-wrap gap-6 text-sm">
              <a href="#especialidades" className="transition hover:text-white">Especialidades</a>
              <a href="#unidades" className="transition hover:text-white">Unidades</a>
              <a href="#contato" className="transition hover:text-white">Contato</a>
              <Link href="/login" className="transition hover:text-white">Área restrita</Link>
            </nav>
          </div>

          <p className="mt-8 border-t border-white/10 pt-6 text-xs">
            © {new Date().getFullYear()} Clínica KidSaber. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
