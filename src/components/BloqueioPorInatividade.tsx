"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Lock, Clock } from "lucide-react";

/**
 * Encerra a sessão depois de um tempo sem uso.
 *
 * A sessão de oito horas resolve o computador ligado da noite para o dia; não
 * resolve a tela deixada aberta no meio do expediente. Numa recepção, o
 * prontuário fica visível para quem passar pelo balcão.
 *
 * Antes de encerrar, avisa: quem foi atender o telefone com a evolução da
 * sessão pela metade precisa de uma chance de continuar.
 */

/** Tempo parado até o aviso aparecer. */
const INATIVIDADE_MS = 15 * 60 * 1000;

/** Tempo do aviso na tela antes de sair de fato. */
const AVISO_MS = 60 * 1000;

const EVENTOS = ["mousedown", "keydown", "wheel", "touchstart", "pointerdown"] as const;

export default function BloqueioPorInatividade() {
  const [avisando, setAvisando] = useState(false);
  const [restam, setRestam] = useState(Math.round(AVISO_MS / 1000));

  const ocioso = useRef<ReturnType<typeof setTimeout>>();
  const contagem = useRef<ReturnType<typeof setInterval>>();

  /**
   * O estado do aviso também vive num ref.
   *
   * Os ouvintes de atividade precisam consultar o valor atual, e ler o `state`
   * dentro deles obrigaria a incluir `avisando` nas dependências do efeito —
   * o efeito então se remontaria justamente quando o aviso aparecesse,
   * cancelando a contagem que ele acabara de iniciar. O aviso nunca chegaria
   * ao fim e a sessão jamais seria encerrada.
   */
  const avisandoRef = useRef(false);

  const limpar = useCallback(() => {
    if (ocioso.current) clearTimeout(ocioso.current);
    if (contagem.current) clearInterval(contagem.current);
  }, []);

  const sair = useCallback(() => {
    limpar();
    signOut({ callbackUrl: "/login?motivo=inatividade" });
  }, [limpar]);

  const reiniciar = useCallback(() => {
    limpar();
    avisandoRef.current = false;
    setAvisando(false);
    setRestam(Math.round(AVISO_MS / 1000));

    ocioso.current = setTimeout(() => {
      avisandoRef.current = true;
      setAvisando(true);

      let sobrando = Math.round(AVISO_MS / 1000);
      contagem.current = setInterval(() => {
        sobrando -= 1;
        setRestam(sobrando);
        if (sobrando <= 0) sair();
      }, 1000);
    }, INATIVIDADE_MS);
  }, [limpar, sair]);

  useEffect(() => {
    reiniciar();

    // Com o aviso na tela, mexer o mouse sem querer não deve cancelar um
    // encerramento já anunciado: aí a saída é pelo botão.
    function aoInteragir() {
      if (!avisandoRef.current) reiniciar();
    }

    for (const e of EVENTOS) document.addEventListener(e, aoInteragir, { passive: true });
    return () => {
      for (const e of EVENTOS) document.removeEventListener(e, aoInteragir);
      limpar();
    };
  }, [reiniciar, limpar]);

  if (!avisando) return null;

  const minutos = Math.round(INATIVIDADE_MS / 60000);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="titulo-inatividade"
      aria-describedby="texto-inatividade"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500 text-navy-900">
            <Lock aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="titulo-inatividade" className="font-bold text-navy-900">
              Sua sessão vai encerrar
            </h2>
            <p id="texto-inatividade" className="mt-1 text-sm leading-relaxed text-slate-700">
              O sistema está sem uso há {minutos} minuto{minutos === 1 ? "" : "s"}. Para proteger os
              dados dos pacientes numa tela deixada aberta, o acesso será encerrado.
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm text-slate-700">
          <Clock aria-hidden className="h-4 w-4" />
          <span aria-live="polite">
            Encerrando em <strong className="tabular-nums">{Math.max(0, restam)}</strong> segundo
            {restam === 1 ? "" : "s"}
          </span>
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" autoFocus onClick={reiniciar} className="btn-primary flex-1">
            Continuar trabalhando
          </button>
          <button type="button" onClick={sair} className="btn-secondary flex-1">
            Sair agora
          </button>
        </div>
      </div>
    </div>
  );
}
