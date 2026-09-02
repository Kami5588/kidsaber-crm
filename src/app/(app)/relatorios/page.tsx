import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3, CalendarCheck, XCircle, UserX, Percent, Users, UserPlus,
  Wallet, Clock, AlertTriangle, Megaphone, TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getActiveUnit, getActiveUnitId, ALL_UNITS } from "@/lib/units";
import { availableMonths, byLeadOrigin, bySpecialty, byUnit, monthTotals } from "@/lib/reports";
import ReportExport from "@/components/ReportExport";

export const metadata = { title: "Relatórios · KidSaber Connect" };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Stat({
  icon: Icon, label, value, tone, hint,
}: { icon: any; label: string; value: string; tone: string; hint?: string }) {
  return (
    <div className="card p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

/** Barra proporcional, para comparar volumes sem precisar de biblioteca. */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-slate-700">{label}</span>
        <span className="flex-shrink-0 font-semibold text-slate-800">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-sky" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Faturamento e volume da rede são assunto da gestão, não de quem atende.
  if (user.role === "PROFISSIONAL") notFound();

  const meses = availableMonths();

  // O padrão é o mês corrente, e não o mais recente da lista: como existem
  // sessões agendadas para o futuro, abrir no mais recente mostraria um
  // relatório zerado de um mês que ainda nem começou.
  const mes = searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
    ? searchParams.mes
    : new Date().toISOString().slice(0, 7);

  const activeUnitId = getActiveUnitId();
  const activeUnit = getActiveUnit();
  const unitFilter = activeUnitId === ALL_UNITS ? null : activeUnitId;

  const t = monthTotals(mes, unitFilter);
  const unidades = byUnit(mes);
  const especialidades = bySpecialty(mes, unitFilter);
  const origens = byLeadOrigin(mes, unitFilter);

  const maxEsp = Math.max(1, ...especialidades.map((e) => Number(e.atendimentos)));
  const maxOrig = Math.max(1, ...origens.map((o) => Number(o.total)));

  const nomeMes = format(parseISO(`${mes}-01`), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatório gerencial</h1>
          <p className="text-slate-600">
            Fechamento de <span className="font-medium capitalize">{nomeMes}</span>
            {activeUnit ? ` · unidade ${activeUnit.name}` : " · rede completa"}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <form className="flex items-end gap-2">
            <div>
              <label htmlFor="mes" className="label text-xs">Competência</label>
              <select id="mes" name="mes" defaultValue={mes} className="input w-44">
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {format(parseISO(`${m}-01`), "MMMM/yyyy", { locale: ptBR })}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">Ver</button>
          </form>

          <ReportExport month={mes} unitId={unitFilter} />
        </div>
      </div>

      {/* Atendimento */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">
        Atendimento
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={CalendarCheck} label="Atendimentos realizados" value={String(t.atendimentosRealizados)} tone="bg-teal-500 text-white" />
        <Stat icon={XCircle} label="Cancelados" value={String(t.atendimentosCancelados)} tone="bg-gold-500 text-navy-900" hint="Avisados com antecedência" />
        <Stat icon={UserX} label="Faltas" value={String(t.atendimentosFaltas)} tone="bg-coral-500 text-white" hint="Sem aviso · veja o painel de faltas" />
        <Stat
          icon={Percent}
          label="Taxa de comparecimento"
          value={t.comparecimento === null ? "—" : `${t.comparecimento}%`}
          tone="bg-navy-600 text-white"
          hint="Entre as sessões já encerradas"
        />
        <Stat icon={Clock} label="Ainda agendados" value={String(t.atendimentosAgendados)} tone="bg-slate-700 text-white" />
      </div>

      {/* Pacientes */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Pacientes</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Pacientes ativos" value={String(t.pacientesAtivos)} tone="bg-navy-600 text-white" />
        <Stat icon={UserPlus} label="Novos no mês" value={String(t.novosPacientes)} tone="bg-teal-500 text-white" />
        <Stat icon={Megaphone} label="Contatos recebidos" value={String(t.leadsRecebidos)} tone="bg-gold-500 text-navy-900" />
        <Stat
          icon={TrendingUp}
          label="Contatos convertidos"
          value={String(t.leadsConvertidos)}
          tone="bg-coral-500 text-white"
          hint={t.leadsRecebidos > 0 ? `${Math.round((t.leadsConvertidos / t.leadsRecebidos) * 100)}% dos recebidos` : undefined}
        />
      </div>

      {/* Financeiro */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Financeiro</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={Wallet} label="Recebido" value={brl(t.receitaRecebida)} tone="bg-teal-500 text-white" />
        <Stat icon={Clock} label="A receber" value={brl(t.receitaPendente)} tone="bg-gold-500 text-navy-900" />
        <Stat icon={AlertTriangle} label="Em atraso" value={brl(t.receitaAtrasada)} tone="bg-coral-500 text-white" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Por especialidade */}
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy-800">
            <BarChart3 className="h-4 w-4 text-navy-600" />
            Atendimentos por especialidade
          </h2>
          {especialidades.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
              Nenhum atendimento neste mês.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {especialidades.map((e) => (
                <Bar key={e.specialty} label={e.specialty} value={Number(e.atendimentos)} max={maxEsp} />
              ))}
            </ul>
          )}
        </section>

        {/* Origem dos contatos */}
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy-800">
            <Megaphone className="h-4 w-4 text-navy-600" />
            De onde vieram os contatos
          </h2>
          {origens.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
              Nenhum contato registrado neste mês.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {origens.map((o) => (
                <Bar key={o.origem} label={o.origem} value={Number(o.total)} max={maxOrig} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Comparativo entre unidades */}
      <section className="card mt-6 p-6">
        <h2 className="font-bold text-navy-800">Comparativo entre unidades</h2>
        <p className="mt-1 text-sm text-slate-600">
          Números do mês inteiro, independentemente da unidade selecionada no topo.
        </p>

        <div tabIndex={0} role="region" aria-label="Comparativo entre unidades" className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-600">
                <th scope="col" className="pb-2 pr-4">Unidade</th>
                <th scope="col" className="pb-2 pr-4 text-right">Pacientes ativos</th>
                <th scope="col" className="pb-2 pr-4 text-right">Atendimentos</th>
                <th scope="col" className="pb-2 pr-4 text-right">Cancelados</th>
                <th scope="col" className="pb-2 pr-4 text-right">Faltas</th>
                <th scope="col" className="pb-2 text-right">Recebido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unidades.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      {u.name}
                      {u.isMain ? (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-900">
                          Sede
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-slate-600">{u.city}/{u.state}</span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{u.pacientesAtivos}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{u.atendimentos}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{u.cancelados}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{u.faltas}</td>
                  <td className="py-3 text-right font-semibold tabular-nums text-navy-700">
                    {brl(Number(u.receita ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
