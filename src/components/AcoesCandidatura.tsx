"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  excluirCandidaturaAction,
  mudarSituacaoAction,
  SITUACOES_CANDIDATURA,
} from "@/lib/recrutamento-actions";

/**
 * Situação e exclusão de uma candidatura.
 *
 * A exclusão pede confirmação em dois passos, na própria linha: apagar leva o
 * currículo junto e não tem volta, e um clique errado numa lista de nomes
 * parecidos é fácil demais.
 */
export default function AcoesCandidatura({
  id,
  nome,
  situacao,
}: {
  id: string;
  nome: string;
  situacao: string;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mudar(nova: string) {
    setErro(null);
    startTransition(async () => {
      const r = await mudarSituacaoAction(id, nova);
      if (!r.ok) setErro(r.error ?? "Não foi possível alterar.");
      else router.refresh();
    });
  }

  function excluir() {
    setErro(null);
    startTransition(async () => {
      const r = await excluirCandidaturaAction(id);
      if (!r.ok) {
        setErro(r.error ?? "Não foi possível excluir.");
        setConfirmando(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`situacao-${id}`}>
        Situação de {nome}
      </label>
      <select
        id={`situacao-${id}`}
        value={situacao}
        disabled={pendente}
        onChange={(e) => mudar(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
      >
        {SITUACOES_CANDIDATURA.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {confirmando ? (
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={excluir}
            disabled={pendente}
            className="rounded-lg bg-coral-600 px-2.5 py-1 text-xs font-bold text-white"
          >
            {pendente ? "Excluindo..." : "Confirmar exclusão"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            Cancelar
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          aria-label={`Excluir a candidatura de ${nome}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-coral-400 hover:text-coral-700"
        >
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
          Excluir
        </button>
      )}

      {erro && (
        <span role="alert" className="text-xs text-coral-700">{erro}</span>
      )}
    </div>
  );
}
