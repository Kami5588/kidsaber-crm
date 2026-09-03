import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3, CalendarCheck, XCircle, UserX, Percent, Users, UserPlus,
  Wallet, Clock, AlertTriangle, Megaphone, TrendingUp, Building2, AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getActiveUnit, getActiveUnitId, ALL_UNITS } from "@/lib/units";
import { rawAll } from "@/lib/orm";
import {
  availableMonths, byLeadOrigin, bySpecialty, byUnit, monthTotals,
  byInsurancePlan, defaultersReport, financialSummary,
} from "@/lib/reports";
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
  searchParams: { mes?: string; unitIds?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Faturamento e volume da rede são assunto da gestão, não de quem atende.
  if (user.role === "PROFISSIONAL") notFound();

  const meses = availableMonths();
  const allUnits = rawAll("SELECT id, name FROM Unit WHERE status = 'Ativo' ORDER BY isMain DESC, name ASC");

  const mes = searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
    ? searchParams.mes
    : new Date().toISOString().slice(0, 7);

  // Suporte a múltiplas unidades: se nenhuma selecionada, assume a ativa ou null (todas).
  const selectedUnitIds = searchParams.unitIds
    ? searchParams.unitIds.split(",").filter(Boolean)
    : [getActiveUnitId()];

  const activeUnitId = getActiveUnitId();
  const activeUnit = getActiveUnit();

  // Para queries: null = todas, string específica = uma unidade.
  const unitFilter = activeUnitId === ALL_UNITS ? null : activeUnitId;

  const t = monthTotals(mes, unitFilter);
  const unidades = byUnit(mes);
  const especialidades = bySpecialty(mes, unitFilter);
  const origens = byLeadOrigin(mes, unitFilter);
  const planosSeguro = byInsurancePlan(mes, unitFilter);
  const inadimplentes = defaultersReport(unitFilter);

  const maxEsp = Math.max(1, ...especialidades.map((e) => Number(e.atendimentos)));
  const maxOrig = Math.max(1, ...origens.map((o) => Number(o.total)));
  const maxPlano = Math.max(1, ...planosSeguro.map((p) => Number(p.recebida)));

  const nomeMes = format(parseISO(`${mes}-01`), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Relatório gerencial</h1>
          <p className="text-slate-600">
            Fechamento de <span className="font-medium capitalize">{nomeMes}</span>
            {activeUnit ? ` · unidade ${activeUnit.name}` : " · rede completa"}
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="mes" className="label text-xs">Competência</label>
            <select id="mes" name="mes" defaultValue={mes} className="input w-40">
              {meses.map((m) => (
                <option key={m} value={m}>
                  {format(parseISO(`${m}-01`), "MMMM/yyyy", { locale: ptBR })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="unitIds" className="label text-xs">Unidades</label>
            <select
              id="unitIds"
              name="unitIds"
              multiple
              defaultValue={selectedUnitIds}
              className="input h-10"
              style={{ minWidth: "200px" }}
            >
              <option value={ALL_UNITS}>Todas as unidades</option>
              {allUnits.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Segure Ctrl/Cmd para selecionar múltiplas</p>
          </div>

          <div className="flex items-end gap-2">
            <button type="submit" className="btn-secondary">Filtrar</button>
            <ReportExport month={mes} unitId={unitFilter} />
          </div>
        </form>
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
        <Stat icon={AlertTriangle} label="Em atraso" value={brl(t.receitaAtrasada)} tone="bg-coral-500 text-white" hint={`${inadimplentes.length} paciente(s)`} />
      </div>

      {/* Receita por convênio */}
      <section className="card mb-6 p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy-800">
          <Building2 className="h-4 w-4 text-navy-600" />
          Receita por convênio
        </h2>
        {planosSeguro.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
            Nenhuma fatura registrada neste período.
          </p>
        ) : (
          <div tabIndex={0} role="region" aria-label="Receita por convênio" className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-600">
                  <th scope="col" className="pb-2 pr-4">Convênio</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Faturas</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Recebida</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Pendente</th>
                  <th scope="col" className="pb-2 text-right">Em atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planosSeguro.map((p) => (
                  <tr key={p.plano} className="hover:bg-slate-50/60">
                    <td className="py-3 pr-4 font-medium text-slate-800">{p.plano}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{p.faturas}</td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold text-teal-700">
                      {brl(Number(p.recebida ?? 0))}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gold-700">
                      {brl(Number(p.pendente ?? 0))}
                    </td>
                    <td className="py-3 text-right tabular-nums font-semibold text-coral-700">
                      {brl(Number(p.atrasada ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inadimplência */}
      {inadimplentes.length > 0 && (
        <section className="card mb-6 p-6 border-l-4 border-coral-500">
          <h2 className="flex items-center gap-2 font-bold text-coral-900">
            <AlertCircle className="h-4 w-4 text-coral-600" />
            Pacientes inadimplentes
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {inadimplentes.length} paciente(s) com faturas em atraso
          </p>
          <div tabIndex={0} role="region" aria-label="Pacientes inadimplentes" className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-600">
                  <th scope="col" className="pb-2 pr-4">Paciente</th>
                  <th scope="col" className="pb-2 pr-4">Estágio</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Faturas</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Valor em atraso</th>
                  <th scope="col" className="pb-2 text-right">Último vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inadimplentes.slice(0, 10).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 pr-4 font-medium text-slate-800">{p.fullName}</td>
                    <td className="py-3 pr-4 text-sm text-slate-600">{p.careStage}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{p.totalAtraso}</td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold text-coral-700">
                      {brl(Number(p.valorAtraso ?? 0))}
                    </td>
                    <td className="py-3 text-right text-xs text-slate-600">
                      {format(parseISO(p.ultimoVencimento as string), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inadimplentes.length > 10 && (
            <p className="mt-3 text-xs text-slate-600">
              ... e mais {inadimplentes.length - 10} paciente(s) inadimplente(s).
            </p>
          )}
        </section>
      )}

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
