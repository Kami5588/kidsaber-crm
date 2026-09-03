"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function VagasClient() {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [especialidades, setEspecialidades] = useState("");
  const [unidades, setUnidades] = useState("");
  const [abreAte, setAbreAte] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titulo,
          description: descricao,
          specialties: especialidades || null,
          unitIds: unidades || null,
          expiresAt: abreAte || null,
        }),
      });

      if (res.ok) {
        setTitulo("");
        setDescricao("");
        setEspecialidades("");
        setUnidades("");
        setAbreAte("");
        setAberto(false);
        window.location.reload();
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-sky px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        Nova vaga
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-navy-800">Criar nova vaga</h2>

            <div className="mt-4">
              <label htmlFor="titulo" className="label text-xs">
                Título da vaga
              </label>
              <input
                id="titulo"
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ex: Fonoaudiólogo(a) - Mundo Novo"
                className="input w-full"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="descricao" className="label text-xs">
                Descrição
              </label>
              <textarea
                id="descricao"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes da posição, requisitos, responsabilidades..."
                className="input w-full resize-none"
                rows={4}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="especialidades" className="label text-xs">
                Especialidades (opcional)
              </label>
              <input
                id="especialidades"
                type="text"
                value={especialidades}
                onChange={(e) => setEspecialidades(e.target.value)}
                placeholder="ex: Fonoaudiologia, Psicologia"
                className="input w-full"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="unidades" className="label text-xs">
                Unidades (opcional)
              </label>
              <input
                id="unidades"
                type="text"
                value={unidades}
                onChange={(e) => setUnidades(e.target.value)}
                placeholder="ex: Mundo Novo, Guaíra"
                className="input w-full"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="abreAte" className="label text-xs">
                Vaga aberta até (opcional)
              </label>
              <input
                id="abreAte"
                type="date"
                value={abreAte}
                onChange={(e) => setAbreAte(e.target.value)}
                className="input w-full"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="btn-primary flex-1"
              >
                {enviando ? "Criando..." : "Criar vaga"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
