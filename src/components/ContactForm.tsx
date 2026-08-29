"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContact, type ContactState } from "@/lib/actions";

interface UnitOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

const initialState: ContactState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full sm:w-auto">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {pending ? "Enviando..." : "Solicitar contato"}
    </button>
  );
}

export default function ContactForm({
  units,
  specialties,
}: {
  units: UnitOption[];
  specialties: string[];
}) {
  const [state, formAction] = useFormState(submitContact, initialState);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-teal-50 px-6 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-teal-600" />
        <h3 className="text-xl font-bold text-navy-800">Recebemos seu contato!</h3>
        <p className="max-w-md text-sm text-slate-600">
          Nossa equipe vai retornar em breve pelo telefone ou e-mail informado. Obrigado por
          confiar na KidSaber.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Campo isca contra robôs: invisível e ignorado por quem preenche de verdade. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div>
        <label htmlFor="name" className="label">Seu nome *</label>
        <input id="name" name="name" required className="input" placeholder="Nome do responsável" />
      </div>

      <div>
        <label htmlFor="phone" className="label">Telefone / WhatsApp</label>
        <input id="phone" name="phone" className="input" placeholder="(67) 99999-9999" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="email" className="label">E-mail *</label>
        <input id="email" name="email" type="email" required className="input" placeholder="voce@exemplo.com" />
      </div>

      <div>
        <label htmlFor="unitId" className="label">Unidade de preferência</label>
        <select id="unitId" name="unitId" className="input" defaultValue="">
          <option value="">Ainda não sei</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="interestedSpecialty" className="label">Especialidade de interesse</label>
        <select id="interestedSpecialty" name="interestedSpecialty" className="input" defaultValue="">
          <option value="">Não sei dizer ainda</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="label">Como podemos ajudar? *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="input"
          placeholder="Conte um pouco sobre a criança e o que você está buscando."
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700 sm:col-span-2">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-navy-700 focus:ring-2 focus:ring-navy-500"
          />
          <span>
            Declaro ser o responsável legal pela criança e autorizo a Clínica KidSaber a usar os
            dados informados para retornar este contato, conforme a{" "}
            <a href="/privacidade" target="_blank" className="font-medium text-navy-600 underline underline-offset-2">
              Política de Privacidade
            </a>{" "}
            e os{" "}
            <a href="/termos" target="_blank" className="font-medium text-navy-600 underline underline-offset-2">
              Termos de Uso
            </a>.
          </span>
        </label>
      </div>

      <div className="sm:col-span-2">
        <SubmitButton />
        <p className="mt-3 text-xs text-slate-500">
          Não envie dados de saúde detalhados por aqui. Este canal não é monitorado em tempo
          integral e não substitui atendimento de urgência.
        </p>
      </div>
    </form>
  );
}
