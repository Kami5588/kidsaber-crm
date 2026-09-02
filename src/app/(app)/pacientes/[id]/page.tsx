import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Pencil, FileText, Download, CalendarClock, History, Users2,
  ShieldCheck, Wallet, Paperclip, CornerDownRight, Activity, Eye, EyeOff,
} from "lucide-react";
import { logAccess } from "@/lib/audit";
import { canAccessPatient, getCurrentUser } from "@/lib/permissions";
import { shareableProfessionals } from "@/lib/documents";
import { stageClass, STAGE_META } from "@/lib/care-stage-constants";
import { humanSize } from "@/lib/file-constants";
import {
  formatAge, patientActivity, patientDocuments, patientHeader, patientInvoices,
  patientResponsibles, patientSessions, patientStageHistory, patientTeam,
} from "@/lib/patient-file";
import {
  AttachFileForm, ChangeStageForm, ShareDocumentForm,
} from "@/components/PatientFileActions";

function fmt(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), withTime ? "dd/MM/yyyy 'às' HH:mm" : "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

const ACTION_LABEL: Record<string, string> = {
  VISUALIZAR: "Visualizou",
  CRIAR: "Anexou / cadastrou",
  EDITAR: "Alterou",
  EXCLUIR: "Excluiu",
  EXPORTAR_DADOS: "Exportou os dados",
  EXCLUIR_DADOS_TITULAR: "Eliminou os dados",
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = patientHeader(params.id);
  return { title: p ? `${p.fullName} · Ficha do paciente` : "Ficha do paciente" };
}

export default async function FichaPacientePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const patient = patientHeader(params.id);
  if (!patient) notFound();

  // Prontuário de criança que não é sua não abre, nem digitando a URL.
  if (!canAccessPatient(user, params.id)) notFound();

  await logAccess({
    action: "VISUALIZAR",
    entity: "Patient",
    entityId: params.id,
    detail: "Abriu a ficha completa do paciente.",
  });

  const responsibles = patientResponsibles(params.id);
  const team = patientTeam(params.id);
  const documents = patientDocuments(params.id);
  const sessions = patientSessions(params.id);
  const stages = patientStageHistory(params.id);
  const invoices = user.role === "PROFISSIONAL" ? [] : patientInvoices(params.id);
  const activity = user.role === "ADMIN" ? patientActivity(params.id) : [];
  const professionals = shareableProfessionals(user.professionalId).map((p) => ({
    id: p.id as string,
    fullName: p.fullName as string,
    specialty: (p.specialty as string) ?? null,
  }));

  const specialties = String(patient.specialties ?? "").split(",").filter(Boolean);

  return (
    <div>
      <Link
        href={user.role === "PROFISSIONAL" ? "/meus-pacientes" : "/pacientes"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-navy-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* ---------- Cabeçalho ---------- */}
      <header className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-navy-800">{patient.fullName}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageClass(patient.careStage)}`}>
                {patient.careStage ?? "Sem etapa"}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {patient.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {formatAge(patient.birthDate)} · nascido em {fmt(patient.birthDate)}
              {patient.unidade ? ` · ${patient.unidade}/${patient.unidadeUf}` : ""}
              {patient.convenio ? ` · ${patient.convenio}` : ""}
            </p>

            {specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span key={s} className="rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <ChangeStageForm patientId={params.id} currentStage={patient.careStage} />
            <Link href={`/pacientes/${params.id}/editar`} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Editar cadastro
            </Link>
          </div>
        </div>

        {patient.diagnoses && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Diagnósticos</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{patient.diagnoses}</p>
          </div>
        )}
        {patient.notes && (
          <div className="mt-3 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Observações</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{patient.notes}</p>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ---------- Arquivos ---------- */}
          <section className="card p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-navy-800">
                  <Paperclip className="h-5 w-5 text-navy-600" />
                  Arquivos e laudos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tudo que a família trouxe e o que a equipe produziu, com o histórico de
                  encaminhamentos.
                </p>
              </div>
              {user.role !== "RECEPCAO" && <AttachFileForm patientId={params.id} />}
            </div>

            {documents.length === 0 ? (
              <p className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
                Nenhum arquivo anexado a esta criança ainda.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <li key={d.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                        <FileText className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">{d.name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {d.type}
                          </span>
                          {d.visibleToResponsible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-teal-700">
                              <Eye className="h-3 w-3" /> visível ao responsável
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                              <EyeOff className="h-3 w-3" /> uso interno
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                          {d.originalName ?? "arquivo"} · {humanSize(d.sizeBytes)} · anexado em{" "}
                          {fmt(d.createdAt, true)}
                          {d.enviadoPor ? ` por ${d.enviadoPor}` : ""}
                        </p>

                        {/* Encaminhamentos deste arquivo */}
                        {d.encaminhamentos.length > 0 && (
                          <ul className="mt-3 space-y-1.5 border-l-2 border-teal-200 pl-3">
                            {d.encaminhamentos.map((e: any) => (
                              <li key={e.id} className="text-xs text-slate-600">
                                <CornerDownRight className="mr-1 inline h-3 w-3 text-teal-500" />
                                Encaminhado para <strong>{e.paraProfissional}</strong>
                                {e.specialty ? ` (${e.specialty})` : ""} em {fmt(e.createdAt, true)}
                                {e.encaminhadoPor ? ` por ${e.encaminhadoPor}` : ""}
                                {e.note && <span className="block pl-4 italic text-slate-600">“{e.note}”</span>}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {d.storedName && (
                            <a
                              href={`/api/documentos/${d.storedName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
                            >
                              <Download className="h-4 w-4" /> Abrir arquivo
                            </a>
                          )}
                          {user.role !== "RECEPCAO" && (
                            <ShareDocumentForm documentId={d.id} professionals={professionals} />
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- Sessões ---------- */}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy-800">
              <CalendarClock className="h-5 w-5 text-navy-600" />
              Sessões e evolução
            </h2>

            {sessions.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
                Nenhuma sessão registrada.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100">
                {sessions.map((s) => (
                  <li key={s.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{s.specialty}</p>
                      <span className="text-xs font-medium text-navy-700">{fmt(s.sessionDate, true)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {s.profissional ?? "—"} · {s.status}
                    </p>

                    {s.goals && (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Objetivos:</span> {s.goals}
                      </p>
                    )}
                    {s.evolutionText && (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        <span className="font-medium text-slate-700">Evolução:</span> {s.evolutionText}
                      </p>
                    )}
                    {s.nextSteps && (
                      <p className="mt-1.5 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Próximos passos:</span> {s.nextSteps}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- Registro de atividades ---------- */}
          {user.role === "ADMIN" && (
            <section className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-navy-800">
                <Activity className="h-5 w-5 text-navy-600" />
                Registro de atividades
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Quem acessou ou alterou os dados desta criança, incluindo downloads de arquivo.
              </p>

              {activity.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
                  Nenhum registro ainda.
                </p>
              ) : (
                <ul className="mt-5 space-y-2.5">
                  {activity.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                      <span className="font-mono text-xs text-slate-600">{fmt(a.createdAt, true)}</span>
                      <span className="font-medium text-slate-700">{a.userEmail ?? "—"}</span>
                      <span className="text-slate-600">
                        {ACTION_LABEL[a.action] ?? a.action}
                        {a.entity === "Document" ? " um arquivo" : ""}
                      </span>
                      {a.detail && <span className="w-full text-xs text-slate-600">{a.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* ---------- Coluna lateral ---------- */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-800">
              <Users2 className="h-4 w-4 text-navy-600" />
              Responsáveis
            </h2>
            {responsibles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Nenhum responsável vinculado.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {responsibles.map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="font-medium text-slate-800">{r.fullName}</p>
                    <p className="text-xs text-slate-600">{r.relationship}</p>
                    <p className="text-xs text-slate-600">{r.phone}</p>
                    {r.email && <p className="break-all text-xs text-slate-600">{r.email}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-800">
              <ShieldCheck className="h-4 w-4 text-navy-600" />
              Equipe que atende
            </h2>
            {team.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Nenhum profissional vinculado.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {team.map((t) => (
                  <li key={t.id} className="text-sm">
                    <p className="font-medium text-slate-800">{t.fullName}</p>
                    <p className="text-xs text-slate-600">{t.specialty}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-800">
              <History className="h-4 w-4 text-navy-600" />
              Histórico de etapas
            </h2>
            {stages.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Nenhuma mudança registrada. A etapa atual é{" "}
                <strong>{patient.careStage ?? "sem etapa"}</strong>.
              </p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
                {stages.map((h) => (
                  <li key={h.id} className="relative text-sm">
                    <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500" />
                    <p className="font-medium text-slate-800">
                      {h.fromStage ? `${h.fromStage} → ` : ""}{h.toStage}
                    </p>
                    <p className="text-xs text-slate-600">
                      {fmt(h.createdAt, true)}
                      {h.changedByName ? ` · ${h.changedByName}` : ""}
                    </p>
                    {h.note && <p className="mt-1 text-xs italic text-slate-600">“{h.note}”</p>}
                  </li>
                ))}
              </ol>
            )}
            {patient.careStage && STAGE_META[patient.careStage] && (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                {STAGE_META[patient.careStage].description}
              </p>
            )}
          </section>

          {invoices.length > 0 && (
            <section className="card p-5">
              <h2 className="flex items-center gap-2 font-bold text-navy-800">
                <Wallet className="h-4 w-4 text-navy-600" />
                Financeiro
              </h2>
              <ul className="mt-3 space-y-2.5">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-600">{fmt(i.dueDate)}</span>
                    <span className="font-medium text-slate-800">
                      {Number(i.amount - (i.discount ?? 0)).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        i.status === "Pago"
                          ? "bg-teal-50 text-teal-700"
                          : i.status === "Atrasado"
                          ? "bg-coral-50 text-coral-700"
                          : "bg-gold-50 text-gold-800"
                      }`}
                    >
                      {i.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
