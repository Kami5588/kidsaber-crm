"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  UserPlus, Loader2, KeyRound, Copy, Check, CircleSlash, CircleCheck, Pencil, X,
} from "lucide-react";
import {
  createUserAction, resetPasswordAction, updateUserAction, type UserFormState,
} from "@/lib/user-actions";
import { ROLES, type Role } from "@/lib/roles";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  professionalId: string | null;
  title: string | null;
  jobTitle: string | null;
  active: number;
  mustChangePassword: number;
  displayName?: string;
  professionalName?: string | null;
  specialty?: string | null;
}

interface ProfessionalOption {
  id: string;
  fullName: string;
  specialty?: string | null;
}

function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

/** Mostra a senha gerada uma única vez, com botão de copiar. */
function PasswordReveal({ password, message }: { password: string; message?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
      <p className="text-sm font-semibold text-gold-900">{message}</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-white px-3 py-2.5 font-mono text-base tracking-wide text-navy-800">
          {password}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="btn-secondary"
        >
          {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2.5 text-xs text-gold-800">
        Esta senha não aparece de novo. O sistema pede a troca no primeiro acesso.
      </p>
    </div>
  );
}

const TITLES = ["", "Dra.", "Dr.", "Prof.ª", "Prof.", "Esp.", "Me."];

export default function UsersPanel({
  users,
  professionals,
  currentUserId,
}: {
  users: UserRow[];
  professionals: ProfessionalOption[];
  currentUserId: string;
}) {
  const [createState, createAction] = useFormState<UserFormState, FormData>(createUserAction, { ok: false });
  const [updateState, updateAction] = useFormState<UserFormState, FormData>(updateUserAction, { ok: false });
  const [resetState, resetAction] = useFormState<UserFormState, FormData>(resetPasswordAction, { ok: false });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<Role>("PROFISSIONAL");

  const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;

  return (
    <div className="space-y-6">
      {/* ---------- Criar conta ---------- */}
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy-800">Contas de acesso</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cada pessoa da equipe entra com a própria conta. O perfil define o que ela enxerga.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? "btn-secondary" : "btn-primary"}
          >
            {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Nova conta"}
          </button>
        </div>

        {createState.ok && createState.password && (
          <div className="mt-5">
            <PasswordReveal password={createState.password} message={createState.message} />
          </div>
        )}

        {showForm && (
          <form action={createAction} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Nome completo *</label>
              <input id="name" name="name" required className="input" placeholder="Camila Rocha" />
            </div>

            <div>
              <label htmlFor="email" className="label">E-mail de acesso *</label>
              <input id="email" name="email" type="email" required className="input" placeholder="camila@clinickidsaber.com.br" />
            </div>

            <div>
              <label htmlFor="role" className="label">Perfil *</label>
              <select
                id="role"
                name="role"
                className="input"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                {ROLES.find((r) => r.value === newRole)?.description}
              </p>
            </div>

            <div>
              <label htmlFor="professionalId" className="label">
                Profissional vinculado {newRole === "PROFISSIONAL" && "*"}
              </label>
              <select id="professionalId" name="professionalId" className="input" defaultValue="">
                <option value="">Nenhum</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}{p.specialty ? ` — ${p.specialty}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                É esse vínculo que define quais pacientes a pessoa vê.
              </p>
            </div>

            <div>
              <label htmlFor="title" className="label">Tratamento</label>
              <select id="title" name="title" className="input" defaultValue="">
                {TITLES.map((t) => (
                  <option key={t || "nenhum"} value={t}>{t || "Sem tratamento"}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="jobTitle" className="label">Como aparece no sistema</label>
              <input
                id="jobTitle"
                name="jobTitle"
                className="input"
                placeholder="Fonoaudióloga, Psicopedagoga, Recepcionista..."
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Texto livre: escreva exatamente como a pessoa deve ser chamada.
              </p>
            </div>

            {createState.error && (
              <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700 sm:col-span-2">
                {createState.error}
              </p>
            )}

            <div className="sm:col-span-2">
              <SubmitButton>
                <UserPlus className="h-4 w-4" /> Criar conta e gerar senha
              </SubmitButton>
            </div>
          </form>
        )}
      </section>

      {/* ---------- Mensagens de senha redefinida ---------- */}
      {resetState.ok && resetState.password && (
        <PasswordReveal password={resetState.password} message={resetState.message} />
      )}
      {resetState.error && (
        <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{resetState.error}</p>
      )}
      {updateState.error && (
        <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{updateState.error}</p>
      )}
      {updateState.ok && updateState.message && (
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{updateState.message}</p>
      )}

      {/* ---------- Lista ---------- */}
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Pessoa</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Vínculo</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{u.displayName ?? u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.professionalName ?? <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                      <CircleCheck className="h-3.5 w-3.5" /> Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <CircleSlash className="h-3.5 w-3.5" /> Desativada
                    </span>
                  )}
                  {u.mustChangePassword === 1 && (
                    <span className="mt-1 block text-[11px] text-gold-700">senha inicial pendente</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(editing?.id === u.id ? null : u)}
                      className="rounded-lg p-1.5 text-navy-600 transition hover:bg-navy-50"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <form action={resetAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-gold-700 transition hover:bg-gold-50"
                        title="Redefinir senha"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ---------- Edição ---------- */}
      {editing && (
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-800">Editar {editing.name}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              <X className="h-4 w-4" /> Fechar
            </button>
          </div>

          <form action={updateAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={editing.id} />

            <div>
              <label className="label">Nome completo</label>
              <input name="name" defaultValue={editing.name} className="input" />
            </div>

            <div>
              <label className="label">Perfil</label>
              <select name="role" defaultValue={editing.role} className="input">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Profissional vinculado</label>
              <select name="professionalId" defaultValue={editing.professionalId ?? ""} className="input">
                <option value="">Nenhum</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
                {editing.professionalId &&
                  !professionals.some((p) => p.id === editing.professionalId) && (
                    <option value={editing.professionalId}>{editing.professionalName}</option>
                  )}
              </select>
            </div>

            <div>
              <label className="label">Tratamento</label>
              <select name="title" defaultValue={editing.title ?? ""} className="input">
                {TITLES.map((t) => (
                  <option key={t || "nenhum"} value={t}>{t || "Sem tratamento"}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Como aparece no sistema</label>
              <input name="jobTitle" defaultValue={editing.jobTitle ?? ""} className="input" />
            </div>

            <label className="flex items-center gap-2.5 sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editing.active === 1}
                className="h-4 w-4 rounded border-slate-300 text-navy-700"
              />
              <span className="text-sm text-slate-700">
                Conta ativa
                {editing.id === currentUserId && (
                  <span className="ml-2 text-xs text-coral-600">(esta é a sua conta)</span>
                )}
              </span>
            </label>

            <div className="sm:col-span-2">
              <SubmitButton>
                <Check className="h-4 w-4" /> Salvar alterações
              </SubmitButton>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
