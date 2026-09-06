"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";

/**
 * Cadastro de vaga.
 *
 * Especialidade e unidade são escolhidas numa lista, e não digitadas: vaga
 * cadastrada como "fono" não casaria com "Fonoaudiologia" em nenhum filtro, e
 * o texto livre só aparece como erro meses depois, quando alguém tenta cruzar
 * os dados.
 */
export default function NovaVaga({
  especialidades,
  unidades,
}: {
  especialidades: string[];
  unidades: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  // Esc fecha, e o foco volta ao botão que abriu — senão ele fica preso num
  // diálogo que não está mais na tela.
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(e.currentTarget);
    const corpo = {
      title: String(dados.get("title") ?? ""),
      description: String(dados.get("description") ?? ""),
      specialties: dados.getAll("specialties").map(String).join(", ") || null,
      unitIds: dados.getAll("unitIds").map(String).join(",") || null,
      expiresAt: String(dados.get("expiresAt") ?? "") || null,
    };

    try {
      const resposta = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const json = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(json.erro ?? "Não foi possível salvar a vaga.");
        return;
      }

      setAberto(false);
      // refresh redesenha a lista com os dados novos sem recarregar a página
      // inteira, preservando rolagem e estado do resto da tela.
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-sky px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
      >
        <Plus aria-hidden className="h-4 w-4" />
        Nova vaga
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-nova-vaga"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-navy-900/60 p-4 py-10"
        >
          <form
            onSubmit={onSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="titulo-nova-vaga" className="text-lg font-bold text-navy-800">
              Nova vaga
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Enquanto estiver aberta, a vaga aparece na página inicial do site.
            </p>

            <div className="mt-5">
              <label htmlFor="vaga-titulo" className="label text-xs">Título</label>
              <input
                id="vaga-titulo"
                name="title"
                type="text"
                required
                autoFocus
                maxLength={120}
                placeholder="Fonoaudiólogo(a) para a unidade de Guaíra"
                className="input w-full"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="vaga-descricao" className="label text-xs">Descrição</label>
              <textarea
                id="vaga-descricao"
                name="description"
                required
                rows={5}
                maxLength={4000}
                placeholder="Atividades, requisitos, carga horária e forma de contratação."
                className="input w-full resize-y"
              />
            </div>

            <fieldset className="mt-4">
              <legend className="label text-xs">Especialidades</legend>
              <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
                {especialidades.map((e) => (
                  <label key={e} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      name="specialties"
                      value={e}
                      className="h-4 w-4 rounded border-slate-300 text-navy-600"
                    />
                    <span className="text-sm text-slate-700">{e}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="label text-xs">Unidades</legend>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5">
                {unidades.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      name="unitIds"
                      value={u.id}
                      className="h-4 w-4 rounded border-slate-300 text-navy-600"
                    />
                    <span className="text-sm text-slate-700">{u.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4">
              <label htmlFor="vaga-prazo" className="label text-xs">
                Aberta até (opcional)
              </label>
              <input id="vaga-prazo" name="expiresAt" type="date" className="input w-full" />
              <p className="mt-1 text-xs text-slate-600">
                Passado o prazo, a vaga sai do site sozinha.
              </p>
            </div>

            {erro && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-coral-50 p-3 text-sm text-coral-800">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {erro}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button type="submit" disabled={enviando} aria-busy={enviando} className="btn-primary flex-1">
                {enviando ? "Salvando..." : "Publicar vaga"}
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
