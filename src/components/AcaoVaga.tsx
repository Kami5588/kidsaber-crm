"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { encerrarVagaAction } from "@/lib/recrutamento-actions";

/**
 * Tira a vaga do site, ou devolve.
 *
 * Encerrar não apaga a vaga: as candidaturas recebidas continuam ligadas a
 * ela, e saber para qual posição a pessoa se candidatou é metade da
 * informação.
 */
export default function AcaoVaga({ id, aberta }: { id: string; aberta: boolean }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar() {
    setErro(null);
    startTransition(async () => {
      const r = await encerrarVagaAction(id);
      if (!r.ok) setErro(r.error ?? "Não foi possível alterar.");
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-navy-400 hover:text-navy-700"
      >
        {pendente ? "..." : aberta ? "Encerrar" : "Reabrir"}
      </button>
      {erro && <span role="alert" className="text-xs text-coral-700">{erro}</span>}
    </span>
  );
}
