import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  UserX, Percent, CalendarX, TrendingDown, Phone, ArrowRight, Info, CheckCircle2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { absenceRanking, absencesByWeekday, absenceTotals } from "@/lib/attendance";
import { stageClass } from "@/lib/care-stage-constants";

export const metadata = { title: "Faltas · KidSaber Connect" };

const PERIODOS = [
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 180, label: "6 meses" },
];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Stat({ icon: Icon, label, value, tone, hint }: any) {
  return (
    <div className="card p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function FaltasPage({
  searchParams,
}: {
  searchParams: { dias?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dias = PERIODOS.some((p) => String(p.dias) === searchParams.dias)
    ? Number(searchParams.dias)
    : 90;

  const fim = new Date();
  const inicio = new Date(fim.getTime() - dias * 24 * 3600 * 1000);

  const totais = absenceTotals(user, inicio.toISOString(), fim.toISOString());
  const ranking = absenceRanking(user, inicio.toISOString(), fim.toISOString());
  const porDia = absencesByWeekday(user, inicio.toISOString(), fim.toISOString());

  const maxDia = Math.max(1, ...porDia.map((d) => d.total));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de faltas</h1>
          <p className="text-slate-500">
            Quem não compareceu nos últimos {dias} dias, para a equipe agir antes de virar
            abandono do tratamento.
          </p>
        </div>

        <div className="flex gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/faltas?dias=${p.dias}`}
              className={p.dias === dias ? "btn-primary" : "btn-secondary"}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={UserX} label="Faltas no período" value={String(totais.faltas)} tone="bg-coral-500 text-white" />
        <Stat icon={CalendarX} label="Cancelamentos" value={String(totais.cancelamentos)} tone="bg-gold-500 text-navy-900" hint="Avisados com antecedência" />
        <Stat
          icon={Percent}
          label="Taxa de falta"
          value={totais.taxaFalta === null ? "—" : `${totais.taxaFalta}%`}
          tone="bg-navy-600 text-white"
          hint="Sobre as sessões já encerradas"
        />
        <Stat
          icon={TrendingDown}
          label="Deixou de faturar"
          value={brl(totais.prejuizoEstimado)}
          tone="bg-slate-700 text-white"
          hint="Estimativa pelo valor médio da sessão"
        />
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy-600" />
        <p className="text-xs leading-relaxed text-navy-900/80">
          <strong>Falta</strong> é quando a criança não aparece sem avisar — o horário se perde.
          <strong className="ml-1">Cancelamento</strong> é o aviso com antecedência, que ainda
          permite encaixar outra criança. Marque a diferença ao fechar a sessão: é o que faz este
          painel valer alguma coisa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="font-bold text-navy-800">Pacientes com faltas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ordenado por número de faltas. Quem tem menos de duas sessões no período fica de fora,
            para não destacar quem só começou.
          </p>

          {ranking.length === 0 ? (
            totais.faltas > 0 ? (
              // Há faltas no período, mas nenhuma criança atingiu o mínimo de
              // sessões. Sem esta ressalva o painel se contradiz: o topo mostra
              // faltas e a tabela diz que não há nenhuma.
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-gold-50 p-5">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600" />
                <div>
                  <p className="font-semibold text-navy-900">
                    {totais.faltas === 1 ? "A única falta do período é" : "As faltas do período são"}{" "}
                    de quem mal começou
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Quem tem menos de duas sessões marcadas fica fora do ranking, para não parecer
                    faltoso por causa de um único horário perdido. Assim que houver mais sessões, o
                    nome aparece aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-teal-50 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
                <div>
                  <p className="font-semibold text-teal-900">Nenhuma falta registrada</p>
                  <p className="mt-1 text-sm text-teal-800/80">
                    Ou o comparecimento está em dia, ou as faltas ainda estão sendo lançadas como
                    cancelamento. Confira como a equipe encerra as sessões.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="pb-2 pr-4">Paciente</th>
                    <th scope="col" className="pb-2 pr-4 text-right">Faltas</th>
                    <th scope="col" className="pb-2 pr-4 text-right">Realizadas</th>
                    <th scope="col" className="pb-2 pr-4 text-right">Taxa</th>
                    <th scope="col" className="pb-2 pr-4">Última falta</th>
                    <th scope="col" className="pb-2">Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranking.map((r) => (
                    <tr key={r.patientId} className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/pacientes/${r.patientId}`}
                          className="font-medium text-navy-700 hover:underline"
                        >
                          {r.fullName}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">{r.unidade ?? "—"}</span>
                          {r.careStage && (
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${stageClass(r.careStage)}`}>
                              {r.careStage}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="rounded-full bg-coral-50 px-2 py-0.5 font-bold text-coral-700">
                          {r.faltas}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-slate-600">{r.realizadas}</td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            r.taxaFalta >= 40 ? "text-coral-700" : r.taxaFalta >= 20 ? "text-gold-700" : "text-slate-600"
                          }`}
                        >
                          {r.taxaFalta}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {r.ultimaFalta ? format(parseISO(r.ultimaFalta), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </td>
                      <td className="py-3">
                        {r.telefoneResponsavel ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-teal-500" />
                            {r.telefoneResponsavel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                        {r.responsavel && (
                          <span className="block text-[11px] text-slate-500">{r.responsavel}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-bold text-navy-800">Faltas por dia da semana</h2>
          <p className="mt-1 text-sm text-slate-500">
            Um dia que concentra faltas costuma indicar horário ruim para as famílias.
          </p>

          <ul className="mt-5 space-y-3">
            {porDia.map((d) => (
              <li key={d.dia}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-700">{d.dia}</span>
                  <span className="font-semibold text-slate-800">{d.total}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-coral-400"
                    style={{ width: `${Math.round((d.total / maxDia) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
