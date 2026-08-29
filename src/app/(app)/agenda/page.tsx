import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, CalendarDays, CalendarClock, CheckCircle2,
  AlertTriangle, XCircle, Plus, Percent,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { groupByDay, sessionsBetween, summarize, toLocalDayKey } from "@/lib/agenda";

export const metadata = { title: "Agenda · KidSaber Connect" };

/** Cor de cada status, para a semana ser lida de relance. */
const STATUS_STYLE: Record<string, string> = {
  Agendada: "border-l-navy-500 bg-navy-50/70",
  Realizada: "border-l-teal-500 bg-teal-50/70",
  "Relatório pendente": "border-l-gold-500 bg-gold-50/70",
  Cancelada: "border-l-coral-400 bg-coral-50/60 opacity-70",
};

const STATUS_DOT: Record<string, string> = {
  Agendada: "bg-navy-500",
  Realizada: "bg-teal-500",
  "Relatório pendente": "bg-gold-500",
  Cancelada: "bg-coral-400",
};

function StatCard({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-800">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { semana?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // A semana começa na segunda: sábado e domingo entram no fim, onde a clínica
  // raramente atende, em vez de partir a semana ao meio.
  const base = searchParams.semana ? parseISO(searchParams.semana) : new Date();
  const weekStart = startOfWeek(base, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const sessions = sessionsBetween(user, weekStart.toISOString(), weekEnd.toISOString());
  const totals = summarize(sessions);
  const byDay = groupByDay(sessions);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const prev = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const next = format(addDays(weekStart, 7), "yyyy-MM-dd");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500">
            {user.role === "PROFISSIONAL"
              ? "Seus atendimentos da semana."
              : "Atendimentos da semana, por dia."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/agenda?semana=${prev}`} className="btn-secondary" aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href="/agenda" className="btn-secondary">
            Hoje
          </Link>
          <Link href={`/agenda?semana=${next}`} className="btn-secondary" aria-label="Próxima semana">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/sessoes/novo" className="btn-primary">
            <Plus className="h-4 w-4" /> Nova sessão
          </Link>
        </div>
      </div>

      <p className="mb-6 flex items-center gap-2 text-sm font-medium text-navy-700">
        <CalendarDays className="h-4 w-4" />
        {format(weekStart, "d 'de' MMMM", { locale: ptBR })} a{" "}
        {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={CalendarClock} label="Sessões na semana" value={String(totals.total)} tone="bg-navy-600 text-white" />
        <StatCard icon={CalendarDays} label="Agendadas" value={String(totals.agendadas)} tone="bg-navy-100 text-navy-700" />
        <StatCard icon={CheckCircle2} label="Realizadas" value={String(totals.realizadas)} tone="bg-teal-500 text-white" />
        <StatCard icon={AlertTriangle} label="Relatórios pendentes" value={String(totals.relatoriosPendentes)} tone="bg-gold-500 text-navy-900" />
        <StatCard
          icon={Percent}
          label="Comparecimento"
          value={totals.comparecimento === null ? "—" : `${totals.comparecimento}%`}
          tone="bg-coral-500 text-white"
        />
      </div>

      {/* Grade da semana: rola na horizontal no celular, em vez de espremer */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[64rem] grid-cols-7 gap-3">
          {days.map((day) => {
            const key = toLocalDayKey(day.toISOString());
            const daySessions = byDay.get(key) ?? [];
            const isToday = isSameDay(day, today);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-3 ${
                  isToday
                    ? "border-navy-400 bg-navy-50/40 shadow-sm"
                    : isWeekend
                    ? "border-slate-200 bg-slate-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <div>
                    <p className={`text-xs font-bold uppercase ${isToday ? "text-navy-700" : "text-slate-400"}`}>
                      {format(day, "EEE", { locale: ptBR })}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? "text-navy-800" : "text-slate-700"}`}>
                      {format(day, "d")}
                    </p>
                  </div>
                  {daySessions.length > 0 && (
                    <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-bold text-navy-700">
                      {daySessions.length}
                    </span>
                  )}
                </div>

                {daySessions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-300">—</p>
                ) : (
                  <ul className="space-y-2">
                    {daySessions.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/pacientes/${s.patientId}`}
                          className={`block rounded-lg border-l-4 p-2.5 transition hover:shadow-sm ${
                            STATUS_STYLE[s.status] ?? "border-l-slate-300 bg-slate-50"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-700">
                            {format(parseISO(s.sessionDate), "HH:mm")}
                          </p>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                            {s.patientName}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{s.specialty}</p>
                          {user.role !== "PROFISSIONAL" && s.professionalName && (
                            <p className="truncate text-[11px] text-slate-400">{s.professionalName}</p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.keys(STATUS_DOT).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
            {status}
          </span>
        ))}
      </div>

      {totals.total === 0 && (
        <div className="card mt-6 flex items-start gap-3 p-6">
          <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="font-semibold text-slate-800">Nenhuma sessão nesta semana</p>
            <p className="mt-1 text-sm text-slate-600">
              Use as setas para navegar entre as semanas ou cadastre uma nova sessão.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
