"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Check, X, Clock, UserCheck, UserX, Mail } from "lucide-react";
import {
  approveAccessAction, rejectAccessAction, type UserFormState,
} from "@/lib/user-actions";
import { ROLES, type Role } from "@/lib/roles";

interface RequestRow {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ProfessionalOption {
  id: string;
  fullName: string;
  specialty?: string | null;
}

const TITLES = ["", "Dra.", "Dr.", "Prof.ª", "Prof.", "Esp.", "Me."];

function SubmitButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export default function AccessRequestsPanel({
  requests,
  professionals,
}: {
  requests: RequestRow[];
  professionals: ProfessionalOption[];
}) {
  const [approveState, approveAction] = useFormState<UserFormState, FormData>(approveAccessAction, { ok: false });
  const [rejectState, rejectAction] = useFormState<UserFormState, FormData>(rejectAccessAction, { ok: false });

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("PROFISSIONAL");

  const pending = requests.filter((r) => r.status === "PENDENTE");
  const reviewed = requests.filter((r) => r.status !== "PENDENTE");

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-800">
            <Clock className="h-5 w-5 text-gold-600" />
            Pedidos de acesso
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quem entrou com a conta Google e ainda não tem acesso. Nada é liberado até a direção
            aprovar e definir o perfil.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-gold-100 px-3 py-1.5 text-sm font-bold text-gold-800">
            {pending.length} aguardando
          </span>
        )}
      </div>

      {approveState.error && (
        <p className="mt-4 rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
          {approveState.error}
        </p>
      )}
      {approveState.ok && approveState.message && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {approveState.message}
        </p>
      )}
      {rejectState.ok && rejectState.message && (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {rejectState.message}
        </p>
      )}

      {pending.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-600">
          Nenhum pedido aguardando aprovação.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {pending.map((r) => (
            <li key={r.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                {r.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.picture} alt="" className="h-10 w-10 flex-shrink-0 rounded-full" />
                ) : (
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                    <Mail className="h-4 w-4" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{r.name ?? "Sem nome informado"}</p>
                  <p className="truncate text-xs text-slate-600">{r.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewing(reviewing === r.id ? null : r.id)}
                  className={reviewing === r.id ? "btn-secondary" : "btn-primary"}
                >
                  {reviewing === r.id ? <X className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  {reviewing === r.id ? "Cancelar" : "Analisar"}
                </button>
              </div>

              {reviewing === r.id && (
                <div className="mt-4 space-y-4 rounded-2xl bg-slate-50 p-5">
                  <form action={approveAction} className="grid gap-4 sm:grid-cols-2">
                    <input type="hidden" name="requestId" value={r.id} />

                    <div className="sm:col-span-2">
                      <label className="label">Nome completo</label>
                      <input name="name" defaultValue={r.name ?? ""} required className="input" />
                    </div>

                    <div>
                      <label className="label">Perfil de acesso *</label>
                      <select
                        name="role"
                        className="input"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                      >
                        {ROLES.map((x) => (
                          <option key={x.value} value={x.value}>{x.label}</option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-slate-600">
                        {ROLES.find((x) => x.value === role)?.description}
                      </p>
                    </div>

                    <div>
                      <label className="label">
                        Profissional vinculado {role === "PROFISSIONAL" && "*"}
                      </label>
                      <select name="professionalId" className="input" defaultValue="">
                        <option value="">Nenhum</option>
                        {professionals.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName}{p.specialty ? ` — ${p.specialty}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Tratamento</label>
                      <select name="title" className="input" defaultValue="">
                        {TITLES.map((t) => (
                          <option key={t || "nenhum"} value={t}>{t || "Sem tratamento"}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Como aparece no sistema</label>
                      <input name="jobTitle" className="input" placeholder="Fonoaudióloga..." />
                    </div>

                    <div className="sm:col-span-2">
                      <SubmitButton className="btn-primary">
                        <Check className="h-4 w-4" /> Liberar acesso
                      </SubmitButton>
                    </div>
                  </form>

                  <form action={rejectAction} className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
                    <input type="hidden" name="requestId" value={r.id} />
                    <div className="min-w-0 flex-1">
                      <label className="label text-xs">Recusar, com motivo (opcional)</label>
                      <input name="note" className="input" placeholder="Ex.: pessoa não faz parte da equipe" />
                    </div>
                    <SubmitButton className="btn-danger">
                      <UserX className="h-4 w-4" /> Recusar
                    </SubmitButton>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <details className="mt-6 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Pedidos já analisados ({reviewed.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {reviewed.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "APROVADO"
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.status === "APROVADO" ? "Aprovado" : "Recusado"}
                </span>
                <span className="text-slate-700">{r.email}</span>
                {r.reviewedByName && (
                  <span className="text-xs text-slate-600">por {r.reviewedByName}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
