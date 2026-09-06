/**
 * Constantes de recrutamento sem dependência de servidor.
 *
 * Ficam separadas de recrutamento.ts porque aquele módulo importa node:fs e
 * não pode ser carregado pelo formulário, que roda no navegador.
 */

/** Currículo não precisa de mais que isto, e o teto protege o volume. */
export const MAX_CURRICULO_BYTES = 5 * 1024 * 1024;

export const ACCEPT_CURRICULO = ".pdf,.doc,.docx";

/**
 * Por quanto tempo o currículo de quem não foi contratado fica guardado.
 *
 * Currículo é dado pessoal de alguém que não é paciente nem funcionário: sem
 * prazo, a clínica acumularia indefinidamente documentos de pessoas que só
 * mandaram um e-mail uma vez. Doze meses cobrem um processo seletivo e as
 * vagas que surgirem logo depois.
 */
export const MESES_GUARDA_CURRICULO = 12;

/**
 * Etapas do processo seletivo.
 *
 * Mora aqui, e não junto das ações, porque num arquivo "use server" todo
 * export vira referência de server action: a lista chegaria ao componente como
 * função, e o .map quebraria a tela inteira em produção.
 */
export const SITUACOES_CANDIDATURA = [
  "Novo",
  "Em análise",
  "Entrevista",
  "Contratado",
  "Não selecionado",
] as const;
