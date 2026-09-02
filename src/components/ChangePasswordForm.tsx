"use client";

import { useFormState, useFormStatus } from "react-dom";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { changeOwnPasswordAction, type UserFormState } from "@/lib/user-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
      Alterar senha
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState<UserFormState, FormData>(changeOwnPasswordAction, {
    ok: false,
  });

  return (
    <section className="card p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
        <KeyRound className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-navy-800">Alterar senha</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Use uma senha que você não utilize em outros serviços. Ela dá acesso a prontuários de
        crianças.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="label">Senha atual</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="label">Nova senha</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
          <p className="mt-1.5 text-xs text-slate-600">Mínimo de 8 caracteres.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Repita a nova senha</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {state.message}
          </p>
        )}

        <SubmitButton />
      </form>
    </section>
  );
}
