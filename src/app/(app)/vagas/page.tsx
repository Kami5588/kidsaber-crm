import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Briefcase, Download, MapPin, Mail, Phone, Users2, CalendarClock, Inbox,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { rawAll } from "@/lib/orm";
import { SPECIALTIES } from "@/lib/entities";
import { listUnits } from "@/lib/units";
import { humanSize } from "@/lib/file-constants";
import { MESES_GUARDA_CURRICULO } from "@/lib/recrutamento-constants";
import NovaVaga from "@/components/NovaVaga";
import AcaoVaga from "@/components/AcaoVaga";
import AcoesCandidatura from "@/components/AcoesCandidatura";

export const metadata = { title: "Recrutamento · KidSaber Connect" };

export default async function VagasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") notFound();

  const vagas = rawAll(
    `SELECT j.*,
       (SELECT COUNT(*) FROM JobApplication a WHERE a.jobId = j.id) AS candidatos
     FROM JobOpening j
     ORDER BY j.createdAt DESC`
  );

  const candidaturas = rawAll(
    `SELECT a.*, j.title AS vagaTitulo
     FROM JobApplication a
     LEFT JOIN JobOpening j ON a.jobId = j.id
     ORDER BY a.createdAt DESC
     LIMIT 60`
  );

  const hoje = new Date().toISOString().slice(0, 10);
  const abertas = vagas.filter(
    (v) => v.status === "Aberta" && (!v.expiresAt || String(v.expiresAt) >= hoje)
  ).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recrutamento</h1>
          <p className="text-slate-600">
            As vagas abertas aparecem no site, e os currículos enviados chegam aqui.
          </p>
        </div>
        <NovaVaga
          especialidades={[...SPECIALTIES]}
          unidades={listUnits().map((u) => ({ id: u.id, name: u.name }))}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{abertas}</p>
            <p className="text-sm text-slate-600">Vagas no ar</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy-700 text-white">
            <Users2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{candidaturas.length}</p>
            <p className="text-sm text-slate-600">Currículos recebidos</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500 text-navy-900">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{MESES_GUARDA_CURRICULO} meses</p>
            <p className="text-sm text-slate-600">Prazo de guarda</p>
          </div>
        </div>
      </div>

      <section className="card mb-6 p-6">
        <h2 className="font-bold text-navy-800">Vagas cadastradas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Uma vaga aparece no site enquanto estiver aberta e dentro do prazo.
        </p>

        {vagas.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
            Nenhuma vaga cadastrada. Enquanto isso, o site convida a mandar currículo para o banco
            de talentos.
          </p>
        ) : (
          <div tabIndex={0} role="region" aria-label="Vagas cadastradas" className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-600">
                  <th scope="col" className="pb-2 pr-4">Vaga</th>
                  <th scope="col" className="pb-2 pr-4">Situação</th>
                  <th scope="col" className="pb-2 pr-4">Aberta até</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Candidatos</th>
                  <th scope="col" className="pb-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vagas.map((v) => {
                  const expirada = v.expiresAt && String(v.expiresAt) < hoje;
                  const noAr = v.status === "Aberta" && !expirada;
                  return (
                    <tr key={v.id as string} className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-slate-800">{v.title}</span>
                        {v.specialties ? (
                          <span className="block text-xs text-slate-600">{v.specialties}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            noAr
                              ? "bg-teal-100 text-teal-800"
                              : expirada
                                ? "bg-slate-100 text-slate-700"
                                : "bg-gold-100 text-gold-900"
                          }`}
                        >
                          {noAr ? "No site" : expirada ? "Prazo vencido" : String(v.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {v.expiresAt
                          ? format(parseISO(String(v.expiresAt)), "dd/MM/yyyy", { locale: ptBR })
                          : "Sem prazo"}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums font-semibold text-slate-700">
                        {String(v.candidatos ?? 0)}
                      </td>
                      <td className="py-3 text-right">
                        <AcaoVaga id={v.id as string} aberta={v.status === "Aberta"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy-800">
          <Inbox className="h-4 w-4 text-navy-600" />
          Currículos recebidos
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Currículo é dado pessoal de quem não é paciente nem funcionário: cada abertura fica
          registrada na auditoria, e o arquivo é descartado automaticamente após{" "}
          {MESES_GUARDA_CURRICULO} meses.
        </p>

        {candidaturas.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
            Nenhum currículo recebido ainda.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {candidaturas.map((c) => (
              <li
                key={c.id as string}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{c.candidateName}</p>
                    <p className="text-xs text-slate-600">
                      {c.vagaTitulo ? String(c.vagaTitulo) : "Candidatura espontânea"}
                      {" · "}
                      {format(parseISO(String(c.createdAt)), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {c.resumeStoredName ? (
                    <a
                      href={`/api/candidaturas/${c.id}/curriculo`}
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:border-navy-400"
                    >
                      <Download aria-hidden className="h-3.5 w-3.5" />
                      Baixar currículo
                      <span className="font-normal text-slate-600">
                        ({humanSize(Number(c.resumeSizeBytes ?? 0))})
                      </span>
                    </a>
                  ) : (
                    <span className="flex-shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                      Currículo descartado pelo prazo
                    </span>
                  )}
                </div>

                <div className="mt-3 grid gap-1.5 text-xs text-slate-700 sm:grid-cols-3">
                  <a
                    href={`mailto:${c.candidateEmail}`}
                    className="flex items-center gap-1.5 hover:text-navy-700 hover:underline"
                  >
                    <Mail aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                    <span className="truncate">{c.candidateEmail}</span>
                  </a>
                  <span className="flex items-center gap-1.5">
                    <Phone aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                    {c.candidatePhone}
                  </span>
                  {c.interestedUnits ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                      <span className="truncate">{c.interestedUnits}</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <AcoesCandidatura
                    id={c.id as string}
                    nome={String(c.candidateName)}
                    situacao={String(c.status ?? "Novo")}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
