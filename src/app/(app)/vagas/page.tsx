import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ExternalLink, Trash2, Edit2, Users2 } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { rawAll, rawGet } from "@/lib/orm";
import VagasClient from "@/components/VagasClient";

export const metadata = { title: "Vagas de recrutamento · KidSaber Connect" };

export default async function VagasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") notFound();

  const vagas = rawAll("SELECT * FROM JobOpening ORDER BY createdAt DESC") as any[];
  const aplicacoes = rawAll("SELECT ja.*, j.title FROM JobApplication ja JOIN JobOpening j ON ja.jobId = j.id ORDER BY ja.createdAt DESC LIMIT 50") as any[];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vagas de recrutamento</h1>
          <p className="text-slate-600">Divulgue oportunidades e receba candidaturas</p>
        </div>

        <VagasClient />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-bold text-navy-800">Vagas abertas</h2>

            {vagas.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
                Nenhuma vaga criada ainda. Use o botão acima para criar uma.
              </p>
            ) : (
              <div tabIndex={0} role="region" aria-label="Vagas abertas" className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-600">
                      <th scope="col" className="pb-2 pr-4">Título</th>
                      <th scope="col" className="pb-2 pr-4">Status</th>
                      <th scope="col" className="pb-2 pr-4 text-right">Candidatos</th>
                      <th scope="col" className="pb-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vagas.map((v) => {
                      const candidatos = aplicacoes.filter(a => a.jobId === v.id).length;
                      const expirada = v.expiresAt && new Date(v.expiresAt) < new Date();
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60">
                          <td className="py-3 pr-4 font-medium text-slate-800">{v.title}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              expirada ? "bg-slate-100 text-slate-700" :
                              v.status === "Aberta" ? "bg-teal-100 text-teal-700" :
                              "bg-gold-100 text-gold-900"
                            }`}>
                              {expirada ? "Expirada" : v.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums font-semibold text-slate-700">
                            {candidatos}
                          </td>
                          <td className="py-3 flex items-center justify-end gap-2">
                            <a href={`/vagas/${v.id}`} className="text-navy-600 hover:text-navy-800">
                              <Edit2 className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy-800">
              <Users2 className="h-4 w-4" />
              Candidaturas recentes
            </h2>

            {aplicacoes.length === 0 ? (
              <p className="mt-5 text-sm text-slate-600">Nenhuma candidatura ainda.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {aplicacoes.slice(0, 10).map((a) => (
                  <li key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800">{a.candidateName}</p>
                        <p className="mt-0.5 text-slate-600">{a.title}</p>
                        {a.interestedUnits && (
                          <p className="mt-1 text-[11px] text-teal-700 font-medium">
                            📍 {a.interestedUnits}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {format(parseISO(a.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
