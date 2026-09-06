"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Paperclip } from "lucide-react";
import { ACCEPT_CURRICULO } from "@/lib/recrutamento-constants";

/**
 * Envio de currículo pelo site.
 *
 * O erro aparece na própria página, e não num alert: quem preenche precisa
 * continuar vendo o que digitou para corrigir. O mesmo vale para o aviso de
 * sucesso, que substitui o formulário — reenviar o mesmo currículo por engano
 * é o resultado mais provável de um formulário que continua ali, vazio.
 */

export interface VagaResumo {
  id: string;
  title: string;
}

export default function FormularioCandidatura({
  unidades,
  vagas,
}: {
  unidades: { id: string; name: string; city: string; state: string }[];
  vagas: VagaResumo[];
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const dados = new FormData(e.currentTarget);
      const resposta = await fetch("/api/candidaturas", { method: "POST", body: dados });
      const corpo = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div role="status" className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 text-center">
        <CheckCircle2 aria-hidden className="mx-auto h-10 w-10 text-teal-600" />
        <p className="mt-3 text-lg font-extrabold text-navy-800">Currículo recebido</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Obrigado pelo interesse na KidSaber. A coordenação analisa os currículos recebidos e
          entra em contato quando houver uma oportunidade compatível com o seu perfil.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="cand-nome" className="label text-xs">Nome completo</label>
        <input
          id="cand-nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          placeholder="Seu nome"
          className="input w-full"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cand-email" className="label text-xs">E-mail</label>
          <input
            id="cand-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="cand-telefone" className="label text-xs">Telefone com DDD</label>
          <input
            id="cand-telefone"
            name="telefone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="(44) 99999-0000"
            className="input w-full"
          />
        </div>
      </div>

      {/* Fieldset porque são várias caixas para uma pergunta só: sem ele, o
          leitor de tela anuncia as opções sem dizer do que se trata. */}
      <fieldset>
        <legend className="label text-xs">Unidades de interesse</legend>
        <p className="mb-2 text-xs text-slate-600">Marque onde você teria disponibilidade.</p>
        <div className="space-y-2">
          {unidades.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="unidades"
                value={u.name}
                className="h-4 w-4 rounded border-slate-300 text-navy-600"
              />
              <span className="text-sm text-slate-700">
                {u.name} <span className="text-slate-600">· {u.city}/{u.state}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {vagas.length > 0 && (
        <div>
          <label htmlFor="cand-vaga" className="label text-xs">Vaga de interesse</label>
          <select id="cand-vaga" name="vagaId" defaultValue="" className="input w-full">
            <option value="">Candidatura espontânea (banco de talentos)</option>
            {vagas.map((v) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="cand-curriculo" className="label text-xs">
          Currículo (PDF, DOC ou DOCX, até 5 MB)
        </label>
        <input
          id="cand-curriculo"
          name="curriculo"
          type="file"
          required
          accept={ACCEPT_CURRICULO}
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-700 hover:file:bg-navy-100"
        />
      </div>

      {erro && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 p-3 text-sm text-coral-800">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        aria-busy={enviando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-sky px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        <Paperclip aria-hidden className="h-4 w-4" />
        {enviando ? "Enviando..." : "Enviar currículo"}
      </button>

      <p className="text-xs leading-relaxed text-slate-600">
        Seus dados são usados apenas no processo seletivo e guardados por até 12 meses. Depois
        disso, o currículo é descartado automaticamente.
      </p>
    </form>
  );
}
