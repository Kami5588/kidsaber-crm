export const SPECIALTIES = [
  "Fonoaudiologia",
  "Psicologia",
  "Terapia Ocupacional",
  "Fisioterapia",
  "Neurologia",
  "Psicopedagogia",
];

export type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "checkbox";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relation?: string; // key of another entity in ENTITIES
  default?: any;
  showInTable?: boolean;
  colSpan2?: boolean;
}

export interface EntityConfig {
  key: string;
  table: string;
  label: string;
  labelSingular: string;
  displayField: string;
  displayFields?: string[]; // for composed display like "fullName (specialty)"
  icon: string;
  fields: FieldConfig[];
  searchFields: string[];
}

export const ENTITIES: Record<string, EntityConfig> = {
  pacientes: {
    key: "pacientes",
    table: "Patient",
    label: "Pacientes",
    labelSingular: "Paciente",
    displayField: "fullName",
    icon: "Users",
    searchFields: ["fullName", "diagnoses", "cpf"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "fullName", label: "Nome completo", type: "text", required: true, showInTable: true },
      { name: "birthDate", label: "Data de nascimento", type: "date", required: true, showInTable: true },
      { name: "gender", label: "Gênero", type: "select", options: ["Masculino", "Feminino", "Outro"] },
      { name: "status", label: "Status", type: "select", options: ["Ativo", "Inativo", "Em avaliação"], default: "Ativo", showInTable: true },
      { name: "specialties", label: "Especialidades em acompanhamento", type: "multiselect", options: SPECIALTIES },
      { name: "diagnoses", label: "Diagnósticos", type: "textarea", colSpan2: true },
      { name: "cpf", label: "CPF", type: "text" },
      { name: "address", label: "Endereço", type: "text", colSpan2: true },
      { name: "emergencyContact", label: "Contato de emergência", type: "text" },
      { name: "insurancePlanId", label: "Convênio", type: "select", relation: "convenios" },
      { name: "insuranceCardNumber", label: "Número da carteirinha", type: "text" },
      { name: "notes", label: "Observações", type: "textarea", colSpan2: true },
    ],
  },
  responsaveis: {
    key: "responsaveis",
    table: "Responsible",
    label: "Responsáveis",
    labelSingular: "Responsável",
    displayField: "fullName",
    icon: "UserRound",
    searchFields: ["fullName", "email", "phone"],
    fields: [
      { name: "fullName", label: "Nome completo", type: "text", required: true, showInTable: true },
      { name: "email", label: "E-mail", type: "email", required: true, showInTable: true },
      { name: "phone", label: "Telefone", type: "text", required: true, showInTable: true },
      { name: "relationship", label: "Parentesco", type: "select", options: ["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Guardião(ã)", "Outro"], showInTable: true },
      { name: "cpf", label: "CPF", type: "text" },
      { name: "address", label: "Endereço", type: "text", colSpan2: true },
      { name: "notes", label: "Observações", type: "textarea", colSpan2: true },
    ],
  },
  profissionais: {
    key: "profissionais",
    table: "Professional",
    label: "Profissionais",
    labelSingular: "Profissional",
    displayField: "fullName",
    icon: "Stethoscope",
    searchFields: ["fullName", "email", "specialty"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "fullName", label: "Nome completo", type: "text", required: true, showInTable: true },
      { name: "email", label: "E-mail", type: "email", required: true, showInTable: true },
      { name: "phone", label: "Telefone", type: "text" },
      { name: "specialty", label: "Especialidade", type: "select", options: SPECIALTIES, required: true, showInTable: true },
      { name: "councilNumber", label: "Número do conselho", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Ativo", "Inativo"], default: "Ativo", showInTable: true },
      { name: "bio", label: "Biografia", type: "textarea", colSpan2: true },
    ],
  },
  sessoes: {
    key: "sessoes",
    table: "Session",
    label: "Sessões",
    labelSingular: "Sessão",
    displayField: "id",
    icon: "CalendarClock",
    searchFields: [],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "patientId", label: "Paciente", type: "select", relation: "pacientes", required: true, showInTable: true },
      { name: "professionalId", label: "Profissional", type: "select", relation: "profissionais", required: true, showInTable: true },
      { name: "specialty", label: "Especialidade", type: "select", options: SPECIALTIES, required: true, showInTable: true },
      { name: "sessionDate", label: "Data e hora", type: "datetime", required: true, showInTable: true },
      { name: "durationMinutes", label: "Duração (min)", type: "number", default: 50 },
      { name: "status", label: "Status", type: "select", options: ["Agendada", "Realizada", "Relatório pendente", "Cancelada"], default: "Agendada", showInTable: true },
      { name: "goals", label: "Objetivos trabalhados", type: "textarea", colSpan2: true },
      { name: "evolutionText", label: "Relatório de evolução", type: "textarea", colSpan2: true },
      { name: "nextSteps", label: "Próximos passos", type: "textarea", colSpan2: true },
      { name: "notesInternal", label: "Notas internas", type: "textarea", colSpan2: true },
    ],
  },
  leads: {
    key: "leads",
    table: "Lead",
    label: "Leads / CRM",
    labelSingular: "Lead",
    displayField: "name",
    icon: "Megaphone",
    searchFields: ["name", "email", "phone"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "name", label: "Nome", type: "text", required: true, showInTable: true },
      { name: "email", label: "E-mail", type: "email", required: true, showInTable: true },
      { name: "phone", label: "Telefone", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Novo", "Em contato", "Convertido", "Arquivado"], default: "Novo", showInTable: true },
      { name: "origin", label: "Origem", type: "select", options: ["Instagram", "Site", "Indicação", "Google", "WhatsApp", "Facebook", "Outro"], showInTable: true },
      { name: "interestedSpecialty", label: "Especialidade de interesse", type: "select", options: SPECIALTIES },
      { name: "priority", label: "Prioridade", type: "select", options: ["Baixa", "Media", "Alta"], default: "Media", showInTable: true },
      { name: "followUpDate", label: "Próximo follow-up", type: "date", showInTable: true },
      { name: "subject", label: "Assunto", type: "text" },
      { name: "message", label: "Mensagem", type: "textarea", colSpan2: true },
      { name: "notes", label: "Notas do atendimento", type: "textarea", colSpan2: true },
    ],
  },
  convenios: {
    key: "convenios",
    table: "InsurancePlan",
    label: "Convênios",
    labelSingular: "Convênio",
    displayField: "name",
    icon: "ShieldCheck",
    searchFields: ["name", "cnpj"],
    fields: [
      { name: "name", label: "Nome do convênio", type: "text", required: true, showInTable: true },
      { name: "status", label: "Status", type: "select", options: ["Ativo", "Inativo"], default: "Ativo", showInTable: true },
      { name: "cnpj", label: "CNPJ", type: "text" },
      { name: "contactPhone", label: "Telefone de contato", type: "text" },
      { name: "contactEmail", label: "E-mail de contato", type: "email" },
      { name: "coverageSpecialties", label: "Especialidades cobertas", type: "multiselect", options: SPECIALTIES },
      { name: "reimbursementType", label: "Tipo de cobertura", type: "select", options: ["Reembolso", "Faturamento direto", "Não aceito"] },
      { name: "notes", label: "Observações", type: "textarea", colSpan2: true },
    ],
  },
  servicos: {
    key: "servicos",
    table: "ServiceItem",
    label: "Tabela de Serviços",
    labelSingular: "Serviço",
    displayField: "name",
    icon: "ClipboardList",
    searchFields: ["name"],
    fields: [
      { name: "name", label: "Nome do serviço", type: "text", required: true, showInTable: true },
      { name: "specialty", label: "Especialidade", type: "select", options: SPECIALTIES, required: true, showInTable: true },
      { name: "price", label: "Valor (R$)", type: "number", required: true, showInTable: true },
      { name: "sessionDuration", label: "Duração padrão (min)", type: "number", default: 50 },
      { name: "packageSessions", label: "Nº sessões no pacote", type: "number" },
      { name: "active", label: "Ativo", type: "checkbox", default: true, showInTable: true },
    ],
  },
  financeiro: {
    key: "financeiro",
    table: "Invoice",
    label: "Financeiro",
    labelSingular: "Fatura",
    displayField: "id",
    icon: "Wallet",
    searchFields: [],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "patientId", label: "Paciente", type: "select", relation: "pacientes", required: true, showInTable: true },
      { name: "amount", label: "Valor total (R$)", type: "number", required: true, showInTable: true },
      { name: "discount", label: "Desconto (R$)", type: "number", default: 0 },
      { name: "dueDate", label: "Vencimento", type: "date", required: true, showInTable: true },
      { name: "status", label: "Status", type: "select", options: ["Pendente", "Pago", "Atrasado", "Cancelado"], default: "Pendente", showInTable: true },
      { name: "paymentDate", label: "Data de pagamento", type: "date" },
      { name: "paymentMethod", label: "Forma de pagamento", type: "select", options: ["Pix", "Cartão de crédito", "Cartão de débito", "Boleto", "Dinheiro", "Convênio"] },
      { name: "referenceMonth", label: "Competência (AAAA-MM)", type: "text" },
      { name: "responsibleId", label: "Responsável financeiro", type: "select", relation: "responsaveis" },
      { name: "insurancePlanId", label: "Convênio", type: "select", relation: "convenios" },
      { name: "notes", label: "Observações", type: "textarea", colSpan2: true },
    ],
  },
  tarefas: {
    key: "tarefas",
    table: "Task",
    label: "Tarefas",
    labelSingular: "Tarefa",
    displayField: "title",
    icon: "ListChecks",
    searchFields: ["title", "description"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "title", label: "Título", type: "text", required: true, showInTable: true },
      { name: "status", label: "Status", type: "select", options: ["Pendente", "Em andamento", "Concluída", "Cancelada"], default: "Pendente", showInTable: true },
      { name: "priority", label: "Prioridade", type: "select", options: ["Baixa", "Media", "Alta", "Urgente"], default: "Media", showInTable: true },
      { name: "dueDate", label: "Prazo", type: "date", showInTable: true },
      { name: "assignedToId", label: "Responsável", type: "select", relation: "profissionais" },
      { name: "relatedPatientId", label: "Paciente relacionado", type: "select", relation: "pacientes" },
      { name: "relatedLeadId", label: "Lead relacionado", type: "select", relation: "leads" },
      { name: "description", label: "Descrição", type: "textarea", colSpan2: true },
    ],
  },
  interacoes: {
    key: "interacoes",
    table: "Interaction",
    label: "Interações (CRM)",
    labelSingular: "Interação",
    displayField: "summary",
    icon: "MessagesSquare",
    searchFields: ["summary"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "channel", label: "Canal", type: "select", options: ["WhatsApp", "Telefone", "E-mail", "Presencial", "Instagram", "Site"], required: true, showInTable: true },
      { name: "contactType", label: "Tipo de contato", type: "select", options: ["Lead", "Paciente", "Responsavel"], showInTable: true },
      { name: "interactionDate", label: "Data/hora", type: "datetime", required: true, showInTable: true },
      { name: "direction", label: "Direção", type: "select", options: ["Recebido", "Enviado"] },
      { name: "relatedLeadId", label: "Lead relacionado", type: "select", relation: "leads" },
      { name: "relatedPatientId", label: "Paciente relacionado", type: "select", relation: "pacientes" },
      { name: "relatedResponsibleId", label: "Responsável relacionado", type: "select", relation: "responsaveis" },
      { name: "followUpDate", label: "Próximo follow-up", type: "date" },
      { name: "summary", label: "Resumo do contato", type: "textarea", required: true, colSpan2: true },
    ],
  },
  "lista-espera": {
    key: "lista-espera",
    table: "Waitlist",
    label: "Lista de Espera",
    labelSingular: "Item da lista",
    displayField: "name",
    icon: "Hourglass",
    searchFields: ["name", "phone"],
    fields: [
      { name: "unitId", label: "Unidade", type: "select", relation: "unidades", showInTable: true },
      { name: "name", label: "Nome", type: "text", required: true, showInTable: true },
      { name: "phone", label: "Telefone", type: "text", required: true, showInTable: true },
      { name: "email", label: "E-mail", type: "email" },
      { name: "desiredSpecialty", label: "Especialidade desejada", type: "select", options: SPECIALTIES, showInTable: true },
      { name: "priority", label: "Prioridade", type: "select", options: ["Baixa", "Media", "Alta"], default: "Media", showInTable: true },
      { name: "status", label: "Status", type: "select", options: ["Aguardando", "Contatado", "Agendado", "Desistiu"], default: "Aguardando", showInTable: true },
      { name: "addedDate", label: "Data de entrada", type: "date" },
      { name: "notes", label: "Observações", type: "textarea", colSpan2: true },
    ],
  },
  documentos: {
    key: "documentos",
    table: "Document",
    label: "Documentos",
    labelSingular: "Documento",
    displayField: "name",
    icon: "FileText",
    searchFields: ["name"],
    fields: [
      { name: "patientId", label: "Paciente", type: "select", relation: "pacientes", required: true, showInTable: true },
      { name: "name", label: "Nome do documento", type: "text", required: true, showInTable: true },
      { name: "type", label: "Tipo", type: "select", options: ["Laudo", "Atestado", "Contrato", "Anamnese", "Relatório", "Receita", "Outro"], showInTable: true },
      { name: "fileUrl", label: "Link do arquivo", type: "text", required: true, colSpan2: true },
      { name: "uploadDate", label: "Data de upload", type: "date", showInTable: true },
      { name: "visibleToResponsible", label: "Visível para responsável", type: "checkbox", default: true },
    ],
  },
  satisfacao: {
    key: "satisfacao",
    table: "SatisfactionSurvey",
    label: "Pesquisa de Satisfação",
    labelSingular: "Avaliação",
    displayField: "id",
    icon: "Smile",
    searchFields: [],
    fields: [
      { name: "patientId", label: "Paciente", type: "select", relation: "pacientes", required: true, showInTable: true },
      { name: "rating", label: "Nota (0-10)", type: "number", required: true, showInTable: true },
      { name: "surveyDate", label: "Data", type: "date", showInTable: true },
      { name: "comments", label: "Comentários", type: "textarea", colSpan2: true },
    ],
  },
};

export function getEntity(key: string): EntityConfig | undefined {
  return ENTITIES[key];
}
