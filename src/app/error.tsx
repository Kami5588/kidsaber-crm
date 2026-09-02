"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

/**
 * Tela de erro inesperado.
 *
 * Mostra uma mensagem em português e um botão de tentar de novo, em vez da
 * pilha de erro do Next. O detalhe técnico vai para o console do servidor, que
 * é onde ele ajuda — e não para a tela de quem está atendendo.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erro na aplicação]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
          <AlertTriangle className="h-7 w-7" />
        </span>

        <h1 className="mt-6 text-3xl font-extrabold text-navy-800">Algo deu errado</h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          Tivemos um problema ao carregar esta página. Nenhum dado foi perdido. Tente novamente e,
          se continuar, avise a administração da clínica.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCw className="h-4 w-4" /> Tentar novamente
          </button>
          <Link href="/dashboard" className="btn-secondary">
            <Home className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-slate-600">
            Código para suporte: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
