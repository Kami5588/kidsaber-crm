"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, User } from "lucide-react";
import { searchPatientsAction, type SearchHit } from "@/lib/search-actions";
import { stageClass } from "@/lib/care-stage-constants";

export default function QuickSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Espera a digitação parar antes de consultar, senão cada tecla vira uma
  // busca no banco.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelado = false;

    const timer = setTimeout(async () => {
      try {
        const r = await searchPatientsAction(q);
        // Uma resposta antiga que chega atrasada não pode sobrescrever a atual.
        if (!cancelado) {
          setHits(r);
          setCursor(0);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [term]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Atalho de teclado: a recepção atende no telefone e não quer usar o mouse.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function abrir(hit: SearchHit) {
    setOpen(false);
    setTerm("");
    router.push(`/pacientes/${hit.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || hits.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      abrir(hits[cursor]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCursor(hits.length - 1);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const semResultado = open && term.trim().length >= 2 && !loading && hits.length === 0;
  const listaAberta = open && (hits.length > 0 || semResultado);

  // Lido em voz alta enquanto a pessoa digita, para a busca não ser um recurso
  // exclusivo de quem enxerga a lista.
  const anuncio = loading
    ? "Buscando pacientes."
    : semResultado
      ? "Nenhum paciente encontrado."
      : hits.length > 0
        ? `${hits.length} ${hits.length === 1 ? "paciente encontrado" : "pacientes encontrados"}. Use as setas para escolher.`
        : "";

  return (
    <div className="relative w-full" ref={boxRef}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar paciente..."
        aria-label="Buscar paciente por nome, CPF ou responsável"
        role="combobox"
        aria-expanded={listaAberta}
        aria-controls="resultados-busca-paciente"
        aria-autocomplete="list"
        aria-activedescendant={
          listaAberta && hits.length > 0 ? `resultado-paciente-${cursor}` : undefined
        }
        autoComplete="off"
        className="input input-with-icon pr-9"
      />

      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-600" />
      ) : term ? (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            inputRef.current?.focus();
          }}
          aria-label="Limpar busca"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {listaAberta && (
        <div className="absolute right-0 z-50 mt-2 w-full min-w-[20rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {semResultado ? (
            <p id="resultados-busca-paciente" className="px-4 py-5 text-center text-sm text-slate-600">
              Nenhum paciente encontrado para “{term.trim()}”.
            </p>
          ) : (
            <ul id="resultados-busca-paciente" role="listbox" aria-label="Pacientes encontrados">
              {hits.map((h, i) => (
                <li key={h.id} role="presentation">
                  <button
                    type="button"
                    id={`resultado-paciente-${i}`}
                    role="option"
                    aria-selected={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => abrir(h)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === cursor ? "bg-navy-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
                      <User className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {h.fullName}
                      </span>
                      <span className="block truncate text-xs text-slate-600">
                        {h.unidade ?? "sem unidade"}
                        {h.responsavel ? ` · resp. ${h.responsavel}` : ""}
                      </span>
                    </span>
                    {h.careStage && (
                      <span
                        className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageClass(h.careStage)}`}
                      >
                        {h.careStage}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
