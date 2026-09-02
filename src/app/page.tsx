import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  Brain, BookOpen, HandHeart, Puzzle, Sparkles, MessageSquare,
  MapPin, Phone, Mail, ArrowRight, CalendarCheck, ClipboardCheck,
  Users2, ShieldCheck, HeartHandshake, Clock, MessageCircle,
  Heart, Briefcase, CheckCircle2, LogIn,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listUnits } from "@/lib/units";
import { SPECIALTIES } from "@/lib/entities";
import ContactForm from "@/components/ContactForm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { BrandLogo } from "@/components/BrandMark";
import { WHATSAPP_URL, PHONE_DISPLAY, BUSINESS_HOURS, EMAIL } from "@/lib/clinic";

export const metadata = {
  title: "Clínica KidSaber · Desenvolvimento infantil com acolhimento e ciência",
  description:
    "Intervenção ABA, Modelo Denver, Terapia Ocupacional, Fonoaudiologia, Psicopedagogia e Psicologia para crianças. Unidades em Mundo Novo, Guaíra e Terra Roxa.",
};

/** Ícone e cor de cada especialidade, na ordem em que aparecem no sistema. */
const SPECIALTY_META: Record<string, { icon: any; text: string; tone: "blue" | "yellow" | "red" }> = {
  "Intervenção Comportamental ABA": {
    icon: Sparkles,
    tone: "blue",
    text: "Estratégias baseadas em evidências para promover autonomia, habilidades sociais e qualidade de vida.",
  },
  "Modelo Denver (ESDM)": {
    icon: Puzzle,
    tone: "yellow",
    text: "Abordagem precoce e naturalista para crianças com autismo, focada na comunicação e na interação social.",
  },
  "Terapia Ocupacional": {
    icon: HandHeart,
    tone: "red",
    text: "Desenvolve habilidades motoras, sensoriais e funcionais para mais independência nas atividades diárias.",
  },
  Fonoaudiologia: {
    icon: MessageSquare,
    tone: "blue",
    text: "Atuação na comunicação, linguagem, fala, voz e deglutição em todas as fases do desenvolvimento.",
  },
  Psicopedagogia: {
    icon: BookOpen,
    tone: "yellow",
    text: "Apoio nas dificuldades de aprendizagem com estratégias personalizadas para cada criança.",
  },
  Psicologia: {
    icon: Brain,
    tone: "red",
    text: "Acompanhamento emocional e comportamental com escuta, acolhimento e intervenções personalizadas.",
  },
};

const TONES = {
  blue: {
    card: "border-navy-100 bg-navy-50/60 hover:border-navy-300",
    icon: "bg-navy-600 text-white",
    title: "text-navy-700",
  },
  yellow: {
    card: "border-gold-200 bg-gold-50/70 hover:border-gold-400",
    icon: "bg-gold-500 text-navy-900",
    title: "text-gold-900",
  },
  red: {
    card: "border-coral-100 bg-coral-50/60 hover:border-coral-300",
    icon: "bg-coral-500 text-white",
    title: "text-coral-600",
  },
};

const STEPS = [
  {
    icon: Phone,
    title: "Primeiro contato",
    text: "Você fala com a nossa equipe pelo WhatsApp ou pelo site e conta o que está buscando.",
  },
  {
    icon: ClipboardCheck,
    title: "Avaliação inicial",
    text: "Agendamos uma avaliação com o profissional da especialidade indicada para o caso.",
  },
  {
    icon: CalendarCheck,
    title: "Plano de acompanhamento",
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
    text: "Cada sessão gera registro de evolução, objetivos trabalhados e próximos passos.",
  },
  {
    icon: HeartHandshake,
    title: "Família por perto",
    text: "Orientação aos responsáveis para que o trabalho continue fora da sala de atendimento.",
  },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const units = listUnits();

  return (
    <div className="bg-white">
      <SiteHeader isLoggedIn={!!session} />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-brand-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(38rem 26rem at 88% 6%, rgba(41,171,226,.30), transparent 65%), radial-gradient(34rem 24rem at 4% 96%, rgba(252,209,22,.32), transparent 62%)",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-navy-700 shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-teal-500" />
              {units.length} unidades para atender você
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight text-navy-800 sm:text-5xl">
              Cada criança tem o seu tempo.{" "}
              <span className="relative inline-block">
                <span className="relative z-10">A gente caminha junto.</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-gold-300/70"
                />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Na Clínica KidSaber, oferecemos atendimento multidisciplinar especializado para o
              desenvolvimento infantil, com acolhimento, respeito e ciência.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-sun px-6 py-3.5 text-sm font-bold text-navy-900 shadow-lg shadow-gold-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold-500/30"
              >
                <CalendarCheck className="h-5 w-5" />
                Agendar uma avaliação
              </a>
              <a
                href="#especialidades"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-navy-200 bg-white px-6 py-3.5 text-sm font-bold text-navy-700 transition hover:-translate-y-0.5 hover:border-navy-400 hover:bg-navy-50"
              >
                <Users2 className="h-5 w-5" />
                Conhecer as especialidades
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {DIFFERENTIALS.map((d) => (
                <div
                  key={d.title}
                  className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <d.icon className="h-5 w-5 text-teal-500" />
                  <p className="mt-2 text-sm font-bold text-navy-800">{d.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{d.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              aria-hidden
              className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-brand-sky opacity-20 blur-2xl sm:h-96 sm:w-96"
            />
            <div className="relative animate-float">
              <BrandLogo
                priority
                width={420}
                height={420}
                className="h-auto w-64 drop-shadow-2xl sm:w-80 lg:w-[26rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Faixa de contato rápido ---------- */}
      <section className="bg-brand-sky">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Phone className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-100">
                Fale com a gente
              </p>
              <p className="text-2xl font-extrabold text-white">{PHONE_DISPLAY}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="hidden items-center gap-2 text-sm font-medium text-teal-50 sm:flex">
              <Clock className="h-4 w-4" />
              {BUSINESS_HOURS}
            </span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-navy-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5 text-teal-700" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Dois caminhos: família ou equipe ---------- */}
      <section id="acesso" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-teal-700">
            Por onde você entra
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">
            Você é da família ou da equipe?
          </h2>
          <p className="mt-4 text-slate-600">
            O site atende as famílias que procuram a clínica. A equipe entra no sistema interno,
            onde ficam a agenda e os prontuários.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Famílias */}
          <article className="group relative overflow-hidden rounded-3xl border-2 border-gold-200 bg-gold-50/60 p-8 transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-sun text-navy-900 shadow-sm">
              <Heart className="h-7 w-7" />
            </span>

            <h3 className="mt-5 text-2xl font-extrabold text-navy-800">
              Sou pai, mãe ou responsável
            </h3>
            <p className="mt-3 leading-relaxed text-slate-600">
              Quer saber se a KidSaber pode ajudar sua filha ou seu filho? Fale com a nossa equipe
              e agende uma avaliação. Não é preciso ter cadastro.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600" />
                Atendimento em Mundo Novo, Guaíra e Terra Roxa
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600" />
                Retorno pelo WhatsApp ou telefone
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600" />
                Orientação sobre a especialidade indicada
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contato" className="btn-gold">
                <CalendarCheck className="h-4 w-4" /> Agendar avaliação
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gold-300 bg-white px-4 py-2.5 text-sm font-bold text-navy-700 transition hover:border-gold-500"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </article>

          {/* Equipe */}
          <article className="group relative overflow-hidden rounded-3xl border-2 border-navy-200 bg-navy-50/60 p-8 transition hover:-translate-y-1 hover:border-navy-400 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-sky text-white shadow-sm">
              <Briefcase className="h-7 w-7" />
            </span>

            <h3 className="mt-5 text-2xl font-extrabold text-navy-800">
              Sou da equipe KidSaber
            </h3>
            <p className="mt-3 leading-relaxed text-slate-600">
              Profissionais, coordenação e recepção entram no KidSaber Connect, o sistema interno
              da clínica. O acesso é liberado pela direção.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
                Agenda e registro de evolução das sessões
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
                Laudos e encaminhamentos entre especialidades
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
                Cada profissional vê apenas os próprios pacientes
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={session ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-sky px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4" />
                {session ? "Ir para o painel" : "Entrar no sistema"}
              </Link>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
              Primeiro acesso? Entre com a conta Google da clínica: a direção libera o seu perfil
              antes do primeiro uso.
            </p>
          </article>
        </div>
      </section>

      {/* ---------- Especialidades ---------- */}
      <section id="especialidades" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-teal-700">
            Nossas especialidades
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">
            Um olhar completo sobre o desenvolvimento
          </h2>
          <p className="mt-4 text-slate-600">
            As especialidades atuam de forma integrada: o que é observado em uma sessão orienta o
            trabalho das outras áreas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALTIES.map((s) => {
            const meta = SPECIALTY_META[s];
            const Icon = meta?.icon ?? Puzzle;
            const tone = TONES[meta?.tone ?? "blue"];
            return (
              <article
                key={s}
                className={`group rounded-2xl border-2 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.card}`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-110 ${tone.icon}`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className={`mt-5 text-lg font-extrabold ${tone.title}`}>{s}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{meta?.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section id="como-funciona" className="scroll-mt-20 bg-navy-50/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-teal-700">
              Como funciona
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">
              Do primeiro contato ao acompanhamento
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-sky text-sm font-extrabold text-white shadow-md">
                  {i + 1}
                </span>
                <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-600">
                  <step.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-navy-800">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Unidades ---------- */}
      <section id="unidades" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-teal-700">Unidades</span>
          <h2 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">Perto de você</h2>
          <p className="mt-4 text-slate-600">
            Atendemos em {units.length} cidades, com a mesma equipe e o mesmo padrão de cuidado.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {units.map((u) => (
            <article
              key={u.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-1.5 bg-brand-sky" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-navy-800">{u.name}</h3>
                  {u.isMain ? (
                    <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-gold-900">
                      Sede
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-teal-700">
                  {u.city} · {u.state}
                </p>

                <div className="mt-5 space-y-2.5 text-sm text-slate-600">
                  {u.address ? (
                    <p className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral-500" />
                      <span>{u.address}</span>
                    </p>
                  ) : null}
                  {u.phone && (
                    <p className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 flex-shrink-0 text-teal-500" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                  {u.email && (
                    <p className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 flex-shrink-0 text-navy-500" />
                      <span className="break-all">{u.email}</span>
                    </p>
                  )}
                </div>

                <a
                  href="#contato"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-navy-600 transition group-hover:gap-2.5 hover:text-navy-800"
                >
                  Agendar nesta unidade <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Contato ---------- */}
      <section id="contato" className="scroll-mt-20 bg-navy-50/50 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-teal-700">Contato</span>
            <h2 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">
              Vamos conversar sobre o seu filho
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Preencha o formulário e nossa equipe entra em contato para entender o caso e orientar
              sobre o próximo passo. Se preferir, chame direto no WhatsApp.
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-sky px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:-translate-y-0.5"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp agora
            </a>

            <div className="mt-8 space-y-3 rounded-2xl border border-navy-100 bg-white p-5">
              <p className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="h-4 w-4 flex-shrink-0 text-teal-500" />
                {PHONE_DISPLAY}
              </p>
              <p className="flex items-center gap-3 text-sm text-slate-700">
                <Mail className="h-4 w-4 flex-shrink-0 text-navy-500" />
                <span className="break-all">{EMAIL}</span>
              </p>
              <p className="flex items-center gap-3 text-sm text-slate-700">
                <Clock className="h-4 w-4 flex-shrink-0 text-coral-500" />
                {BUSINESS_HOURS}
              </p>
            </div>

            <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
              Seus dados são tratados conforme a LGPD e usados apenas para retornar este contato.
            </p>
          </div>

          <div className="rounded-3xl border border-navy-100 bg-white p-6 shadow-lg sm:p-8">
            <ContactForm
              units={units.map((u) => ({ id: u.id, name: u.name, city: u.city, state: u.state }))}
              specialties={SPECIALTIES}
            />
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Botão flutuante de WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 hover:shadow-2xl"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
