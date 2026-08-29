import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarClock, FileText, ArrowRight, Users, ClipboardList, AlertTriangle,
} from "lucide-react";
import { getCurrentUser, patientScope } from "@/lib/permissions";
import { rawAll } from "@/lib/orm";
import { CARE_STAGES, STAGE_META, stageClass } from "@/lib/care-stages";

export const metadata = { title: "Meus pacientes · KidSaber Connect" };

function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return null;
  try {
    return format(parseISO(iso), withTime ? "dd/MM 'às' HH:mm" : "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default async function MeusPacientesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scope = patientScope(user, "p");

  // Cada paciente vem com o essencial para o profissional se situar: em que
  // etapa está, quando foi a última sessão e quando é a próxima.
  const patients = rawAll(
    `SELECT p.id, p.fullName, p.birthDate, p.status, p.careStage, p.diagnoses,
       u.name AS unidade,
       (SELECT MAX(s.sessionDate) FROM Session s
          WHERE s.patientId = p.id AND s.status = 'Realizada') AS ultimaSessao,
       (SELECT MIN(s.sessionDate) FROM Session s
          WHERE s.patientId = p.id AND s.status = 'Agendada' AND s.sessionDate >= ?) AS proximaSessao,
       (SELECT COUNT(*) FROM Session s
          WHERE s.patientId = p.id AND s.status = 'Relatório pendente') AS relatoriosPendentes,
       (SELECT COUNT(*) FROM Document d WHERE d.patientId = p.id) AS documentos
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE ${scope.sql}
     ORDER BY p.fullName ASC`,
    [new Date().toISOString(), ...scope.params]
  );

  const pendentes = patients.reduce((n, p) => n + (p.relatoriosPendentes as number), 0);
  const comSessao = patients.filter((p) => p.proximaSessao).length;

  // Distribuição pelas etapas, só entre os pacientes deste profissional.
  const stageCounts = new Map<string, number>();
  for (const p of patients) {
    const s = (p.careStage as string) ?? "Sem etapa";
    stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
  }

  const isProfissional = user.role === "PROFISSIONAL";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Meus pacientes</h1>
        <p className="text-slate-500">
          {isProfissional
            ? "Apenas as crianças que você acompanha, com o andamento de cada uma."
            : "Pacientes vinculados ao seu cadastro de profissional."}
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="card flex items-start gap-3 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600" />
          <div>
            <p className="font-semibold text-slate-800">Nenhum paciente vinculado</p>
            <p className="mt-1 text-sm text-slate-600">
              {user.professionalId
                ? "Assim que a administração vincular pacientes ao seu cadastro, eles aparecem aqui."
                : "Sua conta ainda não está vinculada a um cadastro de profissional. Peça à administração para fazer o vínculo."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-600 text-white">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-800">{patients.length}</p>
                <p className="text-sm text-slate-500">Pacientes acompanhados</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-800">{comSessao}</p>
                <p className="text-sm text-slate-500">Com sessão agendada</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${
                  pendentes > 0 ? "bg-coral-500" : "bg-gold-500"
                }`}
              >
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-800">{pendentes}</p>
                <p className="text-sm text-slate-500">Relatórios pendentes</p>
              </div>
            </div>
          </div>

          {/* Andamento por etapa */}
          <section className="card mb-8 p-5">
            <h2 className="font-semibold text-slate-800">Andamento dos atendimentos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Em que ponto do processo cada criança está.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {CARE_STAGES.map((stage) => {
                const total = stageCounts.get(stage) ?? 0;
                return (
                  <div
                    key={stage}
                    className={`rounded-xl border px-4 py-3 ${
                      total > 0 ? stageClass(stage) : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                    title={STAGE_META[stage]?.description}
                  >
                    <p className="text-xl font-bold">{total}</p>
                    <p className="text-xs font-medium">{stage}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Lista de pacientes */}
          <div className="grid gap-4 md:grid-cols-2">
            {patients.map((p) => (
              <article key={p.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-navy-800">{p.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      {fmtDate(p.birthDate)}
                      {p.unidade ? ` · ${p.unidade}` : ""}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stageClass(p.careStage)}`}
                  >
                    {p.careStage ?? "Sem etapa"}
                  </span>
                </div>

                {p.diagnoses && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.diagnoses}</p>
                )}

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <dt className="text-slate-400">Última sessão</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">
                      {fmtDate(p.ultimaSessao, true) ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Próxima sessão</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">
                      {fmtDate(p.proximaSessao, true) ?? "não agendada"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {(p.relatoriosPendentes as number) > 0 && (
                    <span className="rounded-full bg-coral-50 px-2.5 py-1 text-[11px] font-semibold text-coral-700">
                      {p.relatoriosPendentes} relatório(s) pendente(s)
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <FileText className="h-3.5 w-3.5" />
                    {p.documentos} documento(s)
                  </span>

                  <Link
                    href={`/pacientes/${p.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 transition hover:text-navy-800"
                  >
                    Abrir ficha <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
