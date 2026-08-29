import { count, rawAll, rawGet, sumWhere } from "@/lib/orm";
import {
  Users, CalendarClock, Wallet, ListChecks, Hourglass, Smile, Megaphone,
  TrendingUp, Building2, AlertTriangle, Cake, Phone,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ALL_UNITS, getActiveUnit, getActiveUnitId, listUnits } from "@/lib/units";
import { canAccessPage, getCurrentUser } from "@/lib/permissions";
import { monthBirthdays } from "@/lib/birthdays";
import { redirect } from "next/navigation";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Nos cartoes de indicador o espaco e curto: centavos so atrapalham a leitura.
const brlCompact = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function StatCard({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string; tone: "navy" | "gold" | "coral" | "teal" }) {
  const toneClasses: Record<string, string> = {
    navy: "bg-navy-700 text-white",
    gold: "bg-gold-500 text-navy-900",
    coral: "bg-coral-500 text-white",
    teal: "bg-teal-500 text-white",
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  // O painel geral mostra a rede inteira. Quem só pode ver os próprios
  // pacientes vai direto para a área dele.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPage(user.role, "/dashboard")) redirect("/meus-pacientes");

  const activeUnitId = getActiveUnitId();
  const activeUnit = getActiveUnit();
  const isAll = activeUnitId === ALL_UNITS;
  const units = listUnits();

  // Cada consulta recebe o recorte da unidade ativa. Na visao consolidada o
  // recorte e vazio e os numeros somam a rede inteira.
  const scope = isAll ? "" : " AND (unitId = ? OR unitId IS NULL)";
  const sp: string[] = isAll ? [] : [activeUnitId];

  const now = new Date();
  const nowIso = now.toISOString();
  const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const currentMonth = nowIso.slice(0, 7);

  const activePatients = count("Patient", `status = ?${scope}`, ["Ativo", ...sp]);
  const upcomingSessionsCount = count(
    "Session",
    `status = ? AND sessionDate BETWEEN ? AND ?${scope}`,
    ["Agendada", nowIso, in7days, ...sp]
  );
  const leadsInFunnel = count("Lead", `status IN ('Novo','Em contato')${scope}`, sp);
  const revenuePaid = sumWhere(
    "Invoice", "amount - discount",
    `status = 'Pago' AND referenceMonth = ?${scope}`, [currentMonth, ...sp]
  );
  const revenuePending = sumWhere(
    "Invoice", "amount - discount",
    `status IN ('Pendente','Atrasado')${scope}`, sp
  );
  const pendingTasks = count("Task", `status IN ('Pendente','Em andamento')${scope}`, sp);
  const waitlistCount = count("Waitlist", `status = ?${scope}`, ["Aguardando", ...sp]);

  // SatisfactionSurvey nao guarda unidade propria: o recorte vem do paciente.
  const avgSatisfaction = rawGet(
    `SELECT AVG(s.rating) as avg FROM SatisfactionSurvey s
     JOIN Patient p ON p.id = s.patientId
     WHERE 1=1${isAll ? "" : " AND (p.unitId = ? OR p.unitId IS NULL)"}`,
    isAll ? [] : [activeUnitId]
  )?.avg as number | null;

  const upcomingSessions = rawAll(
    `SELECT s.*, p.fullName as patientName, pr.fullName as professionalName, u.name as unitName
     FROM Session s
     JOIN Patient p ON p.id = s.patientId
     JOIN Professional pr ON pr.id = s.professionalId
     LEFT JOIN Unit u ON u.id = s.unitId
     WHERE s.sessionDate >= ? AND s.status = 'Agendada'
       ${isAll ? "" : "AND (s.unitId = ? OR s.unitId IS NULL)"}
     ORDER BY s.sessionDate ASC LIMIT 6`,
    isAll ? [nowIso] : [nowIso, activeUnitId]
  );

  const tasks = rawAll(
    `SELECT t.*, p.fullName as patientName
     FROM Task t
     LEFT JOIN Patient p ON p.id = t.relatedPatientId
     WHERE t.status IN ('Pendente','Em andamento')
       ${isAll ? "" : "AND (t.unitId = ? OR t.unitId IS NULL)"}
     ORDER BY (t.dueDate IS NULL), t.dueDate ASC LIMIT 6`,
    isAll ? [] : [activeUnitId]
  );

  const recentLeads = rawAll(
    `SELECT l.*, u.name as unitName
     FROM Lead l
     LEFT JOIN Unit u ON u.id = l.unitId
     WHERE 1=1 ${isAll ? "" : "AND (l.unitId = ? OR l.unitId IS NULL)"}
     ORDER BY l.createdAt DESC LIMIT 5`,
    isAll ? [] : [activeUnitId]
  );

  // Comparativo entre unidades: so faz sentido na visao consolidada.
  const perUnit = isAll
    ? rawAll(
        `SELECT u.id, u.name, u.city, u.isMain,
          (SELECT COUNT(*) FROM Patient p WHERE p.unitId = u.id AND p.status = 'Ativo') AS activePatients,
          (SELECT COUNT(*) FROM Session s WHERE s.unitId = u.id AND s.status = 'Agendada'
             AND s.sessionDate BETWEEN ? AND ?) AS upcomingSessions,
          (SELECT COUNT(*) FROM Lead l WHERE l.unitId = u.id AND l.status IN ('Novo','Em contato')) AS openLeads,
          (SELECT COALESCE(SUM(i.amount - i.discount), 0) FROM Invoice i
             WHERE i.unitId = u.id AND i.status = 'Pago' AND i.referenceMonth = ?) AS revenue
         FROM Unit u WHERE u.status = 'Ativo'
         ORDER BY u.isMain DESC, u.name ASC`,
        [nowIso, in7days, currentMonth]
      )
    : [];

  // Registros anteriores a multiunidade aparecem em todas as visoes, mas nao
  // entram no comparativo - vale avisar em vez de deixar o numero sumir.
  const orphanPatients = isAll ? count("Patient", "unitId IS NULL") : 0;

  const aniversariantes = monthBirthdays(user);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAll ? "Visão consolidada da rede" : `Unidade ${activeUnit?.name}`}
          </h1>
          <p className="text-slate-500">
            {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-3.5 py-1.5 text-sm font-medium text-navy-700">
          <Building2 className="h-4 w-4" />
          {isAll ? `${units.length} unidades ativas` : `${activeUnit?.city} · ${activeUnit?.state}`}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Pacientes ativos" value={String(activePatients)} tone="navy" />
        <StatCard icon={CalendarClock} label="Sessões nos próx. 7 dias" value={String(upcomingSessionsCount)} tone="teal" />
        <StatCard icon={Megaphone} label="Leads no funil" value={String(leadsInFunnel)} tone="gold" />
        <StatCard icon={Hourglass} label="Na lista de espera" value={String(waitlistCount)} tone="coral" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Recebido este mês" value={brlCompact(revenuePaid)} tone="navy" />
        <StatCard icon={TrendingUp} label="A receber" value={brlCompact(revenuePending)} tone="teal" />
        <StatCard icon={ListChecks} label="Tarefas pendentes" value={String(pendingTasks)} tone="gold" />
        <StatCard icon={Smile} label="Satisfação média" value={avgSatisfaction ? `${avgSatisfaction.toFixed(1)} / 10` : "-"} tone="coral" />
      </div>

      {isAll && perUnit.length > 0 && (
        <div className="card mb-8 p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Desempenho por unidade</h2>
            <p className="text-sm text-slate-500">
              Compare as unidades lado a lado ou selecione uma no topo para ver só ela.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Unidade</th>
                  <th className="pb-2 pr-4 text-right">Pacientes ativos</th>
                  <th className="pb-2 pr-4 text-right">Sessões 7 dias</th>
                  <th className="pb-2 pr-4 text-right">Leads abertos</th>
                  <th className="pb-2 text-right">Recebido no mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perUnit.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 font-medium text-slate-800">
                        {u.name}
                        {u.isMain ? (
                          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700">
                            Matriz
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-slate-500">{u.city}</span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-slate-700">{u.activePatients}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{u.upcomingSessions}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{u.openLeads}</td>
                    <td className="py-3 text-right font-semibold text-navy-700">{brl(u.revenue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orphanPatients > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gold-50 px-3.5 py-2.5 text-xs text-gold-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {orphanPatients} paciente(s) ainda sem unidade definida. Eles aparecem em todas as
                visões, mas não entram no comparativo acima. Edite o cadastro para atribuir a unidade.
              </span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Próximas sessões</h2>
            <Link href="/sessoes" className="text-sm font-medium text-navy-600 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingSessions.length === 0 && <p className="py-6 text-sm text-slate-400">Nenhuma sessão agendada.</p>}
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{s.patientName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {s.specialty} · {s.professionalName}
                    {isAll && s.unitName ? ` · ${s.unitName}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-navy-700">{fmtDate(s.sessionDate)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Tarefas pendentes</h2>
            <Link href="/tarefas" className="text-sm font-medium text-navy-600 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.length === 0 && <p className="py-6 text-sm text-slate-400">Nenhuma tarefa pendente.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="py-3">
                <p className="text-sm font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-500">
                  {t.patientName ? `${t.patientName} · ` : ""}
                  {t.dueDate ? fmtDate(t.dueDate) : "sem prazo"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {aniversariantes.length > 0 && (
        <div className="card mt-6 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cake className="h-5 w-5 text-coral-500" />
            <h2 className="font-semibold text-slate-800">
              Aniversariantes de {format(now, "MMMM", { locale: ptBR })}
            </h2>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aniversariantes.map((a) => (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  a.ehHoje ? "border-coral-300 bg-coral-50" : "border-slate-200"
                }`}
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl font-bold ${
                    a.ehHoje ? "bg-coral-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="text-base leading-none">{a.dia}</span>
                  <span className="text-[9px] uppercase leading-none">
                    {format(now, "MMM", { locale: ptBR })}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <Link
                    href={`/pacientes/${a.id}`}
                    className="block truncate text-sm font-semibold text-slate-800 hover:text-navy-600"
                  >
                    {a.fullName}
                  </Link>
                  <span className="block text-xs text-slate-500">
                    faz {a.idadeQueFaz} anos{a.ehHoje ? " · é hoje!" : ""}
                  </span>
                  {a.telefone && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Phone className="h-2.5 w-2.5" />
                      {a.telefone}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Leads recentes</h2>
          <Link href="/leads" className="text-sm font-medium text-navy-600 hover:underline">Ver funil completo</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="pb-2 pr-4">Nome</th>
                <th className="pb-2 pr-4">Origem</th>
                <th className="pb-2 pr-4">Especialidade</th>
                {isAll && <th className="pb-2 pr-4">Unidade</th>}
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.length === 0 && (
                <tr>
                  <td colSpan={isAll ? 5 : 4} className="py-6 text-center text-sm text-slate-400">
                    Nenhum lead registrado.
                  </td>
                </tr>
              )}
              {recentLeads.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{l.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{l.origin ?? "-"}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{l.interestedSpecialty ?? "-"}</td>
                  {isAll && <td className="py-2.5 pr-4 text-slate-500">{l.unitName ?? "-"}</td>}
                  <td className="py-2.5">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
