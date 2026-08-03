import { count, rawAll, rawGet, sumWhere } from "@/lib/orm";
import {
  Users, CalendarClock, Wallet, ListChecks, Hourglass, Smile, Megaphone, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
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
  const activePatients = count("Patient", "status = ?", ["Ativo"]);
  const now = new Date();
  const nowIso = now.toISOString();
  const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const upcomingSessionsCount = count(
    "Session",
    "status = ? AND sessionDate BETWEEN ? AND ?",
    ["Agendada", nowIso, in7days]
  );
  const leadsInFunnel = count("Lead", "status IN ('Novo','Em contato')");
  const currentMonth = nowIso.slice(0, 7);
  const revenuePaid = sumWhere("Invoice", "amount - discount", "status = 'Pago' AND referenceMonth = ?", [currentMonth]);
  const revenuePending = sumWhere("Invoice", "amount - discount", "status IN ('Pendente','Atrasado') ");
  const pendingTasks = count("Task", "status IN ('Pendente','Em andamento')");
  const waitlistCount = count("Waitlist", "status = ?", ["Aguardando"]);
  const avgSatisfaction = rawGet("SELECT AVG(rating) as avg FROM SatisfactionSurvey")?.avg as number | null;

  const upcomingSessions = rawAll(
    `SELECT s.*, p.fullName as patientName, pr.fullName as professionalName
     FROM Session s
     JOIN Patient p ON p.id = s.patientId
     JOIN Professional pr ON pr.id = s.professionalId
     WHERE s.sessionDate >= ? AND s.status = 'Agendada'
     ORDER BY s.sessionDate ASC LIMIT 6`,
    [nowIso]
  );

  const tasks = rawAll(
    `SELECT t.*, p.fullName as patientName
     FROM Task t
     LEFT JOIN Patient p ON p.id = t.relatedPatientId
     WHERE t.status IN ('Pendente','Em andamento')
     ORDER BY (t.dueDate IS NULL), t.dueDate ASC LIMIT 6`
  );

  const recentLeads = rawAll(
    `SELECT * FROM Lead ORDER BY createdAt DESC LIMIT 5`
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Olá! Aqui está o resumo da clínica</h1>
        <p className="text-slate-500">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Pacientes ativos" value={String(activePatients)} tone="navy" />
        <StatCard icon={CalendarClock} label="Sessões nos próx. 7 dias" value={String(upcomingSessionsCount)} tone="teal" />
        <StatCard icon={Megaphone} label="Leads no funil" value={String(leadsInFunnel)} tone="gold" />
        <StatCard icon={Hourglass} label="Na lista de espera" value={String(waitlistCount)} tone="coral" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Recebido este mês" value={`R$ ${revenuePaid.toFixed(2)}`} tone="navy" />
        <StatCard icon={TrendingUp} label="A receber (pendente/atrasado)" value={`R$ ${revenuePending.toFixed(2)}`} tone="teal" />
        <StatCard icon={ListChecks} label="Tarefas pendentes" value={String(pendingTasks)} tone="gold" />
        <StatCard icon={Smile} label="Satisfação média" value={avgSatisfaction ? `${avgSatisfaction.toFixed(1)} / 10` : "-"} tone="coral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Próximas sessões</h2>
            <Link href="/sessoes" className="text-sm font-medium text-navy-600 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingSessions.length === 0 && <p className="py-6 text-sm text-slate-400">Nenhuma sessão agendada.</p>}
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.patientName}</p>
                  <p className="text-xs text-slate-500">{s.specialty} · {s.professionalName}</p>
                </div>
                <span className="text-xs font-medium text-navy-700">{fmtDate(s.sessionDate)}</span>
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

      <div className="mt-6 card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Leads recentes</h2>
          <Link href="/leads" className="text-sm font-medium text-navy-600 hover:underline">Ver funil completo</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="pb-2">Nome</th>
                <th className="pb-2">Origem</th>
                <th className="pb-2">Especialidade</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 font-medium text-slate-800">{l.name}</td>
                  <td className="py-2.5 text-slate-500">{l.origin ?? "-"}</td>
                  <td className="py-2.5 text-slate-500">{l.interestedSpecialty ?? "-"}</td>
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
