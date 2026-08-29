/**
 * Etapas do acompanhamento, sem dependência de banco.
 *
 * Separadas de care-stages.ts porque a configuração de entidades e o menu são
 * carregados também no navegador, onde o SQLite não existe.
 */
export const CARE_STAGES = [
  "Triagem",
  "Avaliação",
  "Plano terapêutico",
  "Em atendimento",
  "Reavaliação",
  "Alta",
  "Interrompido",
] as const;

export type CareStage = (typeof CARE_STAGES)[number];

export const STAGE_META: Record<
  string,
  { description: string; tone: "navy" | "teal" | "gold" | "coral" | "slate"; order: number }
> = {
  Triagem: {
    description: "Primeiro contato recebido; aguardando agendamento da avaliação.",
    tone: "gold",
    order: 1,
  },
  Avaliação: {
    description: "Avaliação inicial marcada ou em andamento.",
    tone: "navy",
    order: 2,
  },
  "Plano terapêutico": {
    description: "Avaliação concluída; definindo objetivos e rotina de sessões.",
    tone: "navy",
    order: 3,
  },
  "Em atendimento": {
    description: "Acompanhamento em curso, com sessões regulares.",
    tone: "teal",
    order: 4,
  },
  Reavaliação: {
    description: "Revisão periódica dos objetivos e da evolução.",
    tone: "gold",
    order: 5,
  },
  Alta: {
    description: "Objetivos alcançados; acompanhamento encerrado.",
    tone: "teal",
    order: 6,
  },
  Interrompido: {
    description: "Acompanhamento interrompido pela família ou por outro motivo.",
    tone: "coral",
    order: 7,
  },
};

export const STAGE_CLASSES: Record<string, string> = {
  navy: "bg-navy-50 text-navy-700 border-navy-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  gold: "bg-gold-50 text-gold-800 border-gold-200",
  coral: "bg-coral-50 text-coral-700 border-coral-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

export function stageClass(stage?: string | null): string {
  const tone = STAGE_META[stage ?? ""]?.tone ?? "slate";
  return STAGE_CLASSES[tone];
}

