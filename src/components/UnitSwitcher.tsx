"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Building2, Check, ChevronDown, Layers } from "lucide-react";
import { setActiveUnit } from "@/lib/actions";
import { ALL_UNITS } from "@/lib/unit-constants";

interface UnitOption {
  id: string;
  name: string;
  city: string;
  state: string;
  isMain: number;
}

export default function UnitSwitcher({
  units,
  activeUnitId,
}: {
  units: UnitOption[];
  activeUnitId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora do menu.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = units.find((u) => u.id === activeUnitId);
  const isAll = activeUnitId === ALL_UNITS;

  function choose(id: string) {
    setOpen(false);
    if (id === activeUnitId) return;
    startTransition(() => {
      setActiveUnit(id);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-navy-400 hover:bg-slate-50 disabled:opacity-60"
      >
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            isAll ? "bg-navy-700 text-white" : "bg-teal-500 text-white"
          }`}
        >
          {isAll ? <Layers className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-600">
            Unidade
          </span>
          <span className="block truncate font-semibold text-slate-800">
            {isAll ? "Todas as unidades" : active?.name ?? "Selecionar"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-slate-600 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={isAll}
            onClick={() => choose(ALL_UNITS)}
            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <Layers className="h-4 w-4 flex-shrink-0 text-navy-600" />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-800">Todas as unidades</span>
              <span className="block text-xs text-slate-600">Visão consolidada da rede</span>
            </span>
            {isAll && <Check className="h-4 w-4 flex-shrink-0 text-teal-700" />}
          </button>

          {units.map((u) => {
            const selected = u.id === activeUnitId;
            return (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(u.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4 flex-shrink-0 text-teal-700" />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {u.name}
                    {u.isMain ? (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-900">
                        Matriz
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-slate-600">
                    {u.city} · {u.state}
                  </span>
                </span>
                {selected && <Check className="h-4 w-4 flex-shrink-0 text-teal-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
