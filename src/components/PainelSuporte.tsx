"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Check, Copy, LifeBuoy, Mail, X } from "lucide-react";

/**
 * Pedido de ajuda para quem cuida do sistema.
 *
 * Antes isto era um link `mailto:` — que só faz alguma coisa quando há um
 * programa de e-mail instalado como padrão no computador. Quem usa Gmail pelo
 * navegador, que é o caso da clínica, clicava e não acontecia nada: sem aba,
 * sem erro, sem pista. O botão parecia quebrado.
 *
 * Agora o e-mail é oferecido de três formas, e a que serve depende de como a
 * pessoa lê e-mail. Copiar funciona em qualquer situação e por isso vem
 * primeiro.
 *
 * A mensagem já vai preenchida com quem pediu e de qual tela: sem isso, o
 * primeiro retorno é sempre "quem é você e o que estava fazendo?".
 */

/** Nome legível da tela, para quem recebe o pedido saber onde foi. */
function nomeDaTela(caminho: string): string {
  const mapa: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/agenda": "Agenda",
    "/faltas": "Faltas",
    "/relatorios": "Relatórios",
    "/pacientes": "Pacientes",
    "/responsaveis": "Responsáveis",
    "/profissionais": "Profissionais",
    "/sessoes": "Sessões",
    "/documentos": "Documentos",
    "/financeiro": "Financeiro",
    "/convenios": "Convênios",
    "/servicos": "Serviços",
    "/leads": "Leads / CRM",
    "/interacoes": "Interações",
    "/lista-espera": "Lista de espera",
    "/tarefas": "Tarefas",
    "/satisfacao": "Satisfação",
    "/unidades": "Unidades",
    "/usuarios": "Contas de acesso",
    "/auditoria": "Auditoria de acesso",
    "/lgpd": "Direitos do titular",
    "/backup": "Cópias de segurança",
    "/vagas": "Recrutamento",
    "/meus-pacientes": "Meus pacientes",
    "/minha-conta": "Minha conta",
  };

  for (const [rota, nome] of Object.entries(mapa)) {
    if (caminho === rota || caminho.startsWith(rota + "/")) return nome;
  }
  return caminho;
}

export default function PainelSuporte({
  email,
  userName,
  perfil,
}: {
  email: string;
  userName?: string | null;
  perfil: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [montado, setMontado] = useState(false);
  const caminho = usePathname() ?? "/";
  const botaoRef = useRef<HTMLButtonElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  // O portal precisa do document, que não existe na renderização do servidor.
  useEffect(() => setMontado(true), []);

  const assunto = "Suporte — KidSaber Connect";
  const corpo = [
    "Descreva abaixo o que aconteceu:",
    "",
    "",
    "---",
    `Quem: ${userName ?? "(não identificado)"} (${perfil})`,
    `Tela: ${nomeDaTela(caminho)}`,
    `Quando: ${new Date().toLocaleString("pt-BR")}`,
  ].join("\n");

  const linkGmail =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(email)}` +
    `&su=${encodeURIComponent(assunto)}` +
    `&body=${encodeURIComponent(corpo)}`;

  const linkMailto =
    `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

  // Esc fecha e devolve o foco ao botão que abriu, senão ele fica preso num
  // painel que não está mais na tela.
  useEffect(() => {
    if (!aberto) return;
    fecharRef.current?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador sem permissão de área de transferência: selecionar o texto
      // deixa a pessoa copiar com o teclado, que é o que ela faria mesmo.
      const campo = document.getElementById("email-suporte") as HTMLInputElement | null;
      campo?.select();
    }
  }

  /**
   * O painel sai daqui por um portal, e não é detalhe de gosto.
   *
   * A barra lateral anima com `transform`, e um elemento com transform vira o
   * bloco de referência de qualquer `position: fixed` dentro dele. O painel
   * ficava então preso à largura da barra — espremido num filete de 16rem, em
   * vez de centralizado na tela.
   */
  const painel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-suporte"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-navy-900/60 p-4"
    >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="titulo-suporte" className="font-bold text-navy-900">
                  Precisa de ajuda com o sistema?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Escreva para quem cuida do KidSaber Connect. Escolha abaixo como prefere enviar.
                </p>
              </div>
              <button
                ref={fecharRef}
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <label htmlFor="email-suporte" className="label text-xs">
                E-mail do suporte
              </label>
              <div className="flex gap-2">
                <input
                  id="email-suporte"
                  type="text"
                  readOnly
                  value={email}
                  onFocus={(e) => e.currentTarget.select()}
                  className="input w-full font-medium"
                />
                <button
                  type="button"
                  onClick={copiar}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border-2 border-navy-200 px-3 text-sm font-bold text-navy-700 transition hover:border-navy-400"
                >
                  {copiado ? (
                    <>
                      <Check aria-hidden className="h-4 w-4 text-teal-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                {copiado ? "Endereço copiado." : ""}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={linkGmail}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-sky px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
              >
                <Mail aria-hidden className="h-4 w-4" />
                Escrever pelo Gmail
              </a>
              <a
                href={linkMailto}
                onClick={() => setAberto(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400"
              >
                Abrir no programa de e-mail do computador
              </a>
            </div>

            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              A mensagem já vai preenchida com o seu nome e a tela em que você está
              (<strong className="text-slate-700">{nomeDaTela(caminho)}</strong>), para poupar a
              primeira pergunta de quem for te ajudar. Nenhum dado de paciente é incluído.
            </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-teal-50 transition hover:bg-white/10"
      >
        <LifeBuoy aria-hidden className="h-4 w-4" />
        Suporte
      </button>

      {aberto && montado && createPortal(painel, document.body)}
    </>
  );
}
