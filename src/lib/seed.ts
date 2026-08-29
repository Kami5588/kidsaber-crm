import bcrypt from "bcryptjs";
import { db, nowIso } from "./db";
import { insertRow, rawAll, rawGet, updateRow } from "./orm";
import { generatePassword } from "./users";

/** Contato geral, usado por profissionais que atendem em mais de uma unidade. */
const TELEFONE_GERAL = "(67) 99244-4152";
const EMAIL_GERAL = "contato@clinickidsaber.com.br";

/**
 * Unidades da rede: sede em Mundo Novo, filiais em Guaíra e Terra Roxa.
 *
 * Roda separado do seed de demonstração porque bancos que já existem em
 * produção nunca passariam pelo ensureSeeded (que só age em base vazia) e
 * ficariam sem nenhuma unidade cadastrada.
 *
 * Os endereços ficam vazios de propósito: serão preenchidos pela clínica na
 * tela de Unidades. Melhor um campo em branco do que um endereço inventado
 * aparecendo no site público.
 */
export function ensureUnits(): Record<string, string> {
  const existing = rawAll("SELECT id, name FROM Unit");
  if (existing.length > 0) {
    return Object.fromEntries(existing.map((u) => [u.name, u.id]));
  }

  const mundoNovo = insertRow("Unit", {
    name: "Mundo Novo",
    city: "Mundo Novo",
    state: "MS",
    address: "Rua Voluntários da Pátria, 343 - Centro, CEP 79980-000",
    phone: "(67) 99244-4152",
    email: EMAIL_GERAL,
    isMain: 1,
    status: "Ativo",
  });
  const guaira = insertRow("Unit", {
    name: "Guaíra",
    city: "Guaíra",
    state: "PR",
    address: "Rua Professor Galvoso, 813 - Centro, CEP 85980-085",
    phone: "(44) 99135-2175",
    email: EMAIL_GERAL,
    isMain: 0,
    status: "Ativo",
  });
  const terraRoxa = insertRow("Unit", {
    name: "Terra Roxa",
    city: "Terra Roxa",
    state: "PR",
    address: "Av. Pres. Castelo Branco, 165 - Centro, CEP 85990-000",
    phone: "(44) 99125-4410",
    email: EMAIL_GERAL,
    isMain: 0,
    status: "Ativo",
  });

  console.log("Unidades criadas: Mundo Novo (sede), Guaíra, Terra Roxa.");
  return { mundoNovo, guaira, terraRoxa };
}

/**
 * Conta de administração principal da clínica.
 *
 * Roda separada do seed de demonstração porque precisa existir também em bases
 * que já têm dados. Se a conta já existe, nada é alterado — a senha em uso não
 * é sobrescrita a cada reinício.
 */
export function ensureOwnerAdmin(): void {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) return;

  if (rawGet("SELECT id FROM User WHERE lower(email) = ?", [email])) return;

  const password = process.env.ADMIN_PASSWORD?.trim() || generatePassword();
  const generated = !process.env.ADMIN_PASSWORD?.trim();

  insertRow(
    "User",
    {
      name: process.env.ADMIN_NAME?.trim() || "Administração KidSaber",
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "ADMIN",
      title: null,
      jobTitle: "Administradora",
      active: 1,
      // Senha definida por quem instalou não precisa de troca forçada;
      // senha gerada aqui, sim.
      mustChangePassword: generated ? 1 : 0,
    },
    { withTimestamps: true }
  );

  console.log("Administrador principal criado:", email);
  if (generated) console.log("Senha inicial gerada:", password);
}


/** Endereço e telefone oficiais de cada unidade, conferidos com a clínica. */
const UNIT_CONTACTS: Record<string, { address: string; phone: string }> = {
  "Mundo Novo": {
    address: "Rua Voluntários da Pátria, 343 - Centro, CEP 79980-000",
    phone: "(67) 99244-4152",
  },
  "Guaíra": {
    address: "Rua Professor Galvoso, 813 - Centro, CEP 85980-085",
    phone: "(44) 99135-2175",
  },
  "Terra Roxa": {
    address: "Av. Pres. Castelo Branco, 165 - Centro, CEP 85990-000",
    phone: "(44) 99125-4410",
  },
};

/**
 * Completa endereço e telefone das unidades que ainda estão em branco.
 *
 * O ensureUnits só age em banco vazio, então bases já em produção nunca
 * receberiam esses dados. Aqui o preenchimento é feito campo a campo e apenas
 * quando o valor está vazio: se a clínica editou algo pela tela, a edição dela
 * prevalece.
 */
export function ensureUnitContacts(): void {
  // Correção pontual: enquanto o telefone de Terra Roxa era desconhecido, a
  // unidade ficou com o número de Guaíra. Como o campo não está vazio, a regra
  // geral abaixo não o alcança — por isso o conserto explícito, restrito a
  // esse valor exato para não tocar em nada que a clínica tenha editado.
  const terraRoxa = rawGet(
    "SELECT id, phone FROM Unit WHERE name = ? AND phone = ?",
    ["Terra Roxa", "(44) 99135-2175"]
  );
  if (terraRoxa) {
    updateRow("Unit", terraRoxa.id as string, { phone: "(44) 99125-4410" });
    console.log("Telefone de Terra Roxa corrigido.");
  }

  for (const unit of rawAll("SELECT id, name, address, phone FROM Unit")) {
    const known = UNIT_CONTACTS[unit.name as string];
    if (!known) continue;

    const patch: Record<string, string> = {};
    if (!String(unit.address ?? "").trim()) patch.address = known.address;
    if (!String(unit.phone ?? "").trim()) patch.phone = known.phone;

    if (Object.keys(patch).length > 0) {
      updateRow("Unit", unit.id as string, patch);
      console.log("Contato preenchido na unidade:", unit.name);
    }
  }
}

export function ensureSeeded() {
  const units = ensureUnits();
  const sede = units.mundoNovo ?? units["Mundo Novo"];
  const guaira = units.guaira ?? units["Guaíra"];
  const terraRoxa = units.terraRoxa ?? units["Terra Roxa"];

  const userCount = (db.prepare("SELECT COUNT(*) as c FROM User").get() as any).c;
  if (userCount > 0) return;

  const passwordHash = bcrypt.hashSync("kidsaber123", 10);
  insertRow(
    "User",
    {
      name: "Administradora KidSaber",
      email: "admin@clinickidsaber.com.br",
      passwordHash,
      role: "ADMIN",
    },
    { withTimestamps: true }
  );

  // ---------- Profissionais ----------
  const profAba = insertRow("Professional", {
    unitId: sede,
    fullName: "Dra. Camila Rocha",
    email: "camila@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Intervenção Comportamental ABA",
    councilNumber: "CRP 14/12345",
    status: "Ativo",
  });
  const profDenver = insertRow("Professional", {
    unitId: sede,
    fullName: "Dra. Letícia Brandt",
    email: "leticia@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Modelo Denver (ESDM)",
    councilNumber: "CRP 14/54321",
    status: "Ativo",
  });
  const profTo = insertRow("Professional", {
    unitId: guaira,
    fullName: "Dra. Beatriz Souza",
    email: "beatriz@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Terapia Ocupacional",
    councilNumber: "CREFITO 12345",
    status: "Ativo",
  });
  const profFono = insertRow("Professional", {
    unitId: guaira,
    fullName: "Dra. Juliana Alves",
    email: "juliana@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Fonoaudiologia",
    councilNumber: "CRFa 12345",
    status: "Ativo",
  });
  const profPsicoped = insertRow("Professional", {
    unitId: terraRoxa,
    fullName: "Dra. Marina Kruger",
    email: "marina@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Psicopedagogia",
    councilNumber: "CRP 08/98765",
    status: "Ativo",
  });
  const profPsi = insertRow("Professional", {
    unitId: terraRoxa,
    fullName: "Dr. Rafael Souza",
    email: "rafael@clinickidsaber.com.br",
    phone: TELEFONE_GERAL,
    specialty: "Psicologia",
    councilNumber: "CRP 08/12345",
    status: "Ativo",
  });

  // ---------- Convênios ----------
  const planUnimed = insertRow("InsurancePlan", {
    name: "Unimed",
    reimbursementType: "Reembolso",
    status: "Ativo",
    coverageSpecialties: "Fonoaudiologia,Psicologia,Terapia Ocupacional",
  });
  insertRow("InsurancePlan", {
    name: "Particular",
    reimbursementType: "Não aceito",
    status: "Ativo",
  });

  // ---------- Responsáveis ----------
  const respMarina = insertRow("Responsible", {
    fullName: "Marina Ferreira",
    email: "marina.ferreira@example.com",
    phone: "(67) 99111-2222",
    relationship: "Mãe",
  });
  const respEduardo = insertRow("Responsible", {
    fullName: "Eduardo Lima",
    email: "eduardo.lima@example.com",
    phone: "(44) 99222-3333",
    relationship: "Pai",
  });
  const respSilvia = insertRow("Responsible", {
    fullName: "Sílvia Nogueira",
    email: "silvia.nogueira@example.com",
    phone: "(44) 99333-1010",
    relationship: "Mãe",
  });

  // ---------- Pacientes ----------
  const patientTs = { withTimestamps: true, timestampFields: ["createdAt", "updatedAt"] };

  const patEnzo = insertRow("Patient", {
    careStage: "Em atendimento",
    unitId: sede,
    fullName: "Enzo Ferreira",
    birthDate: "2019-03-14",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Intervenção Comportamental ABA,Fonoaudiologia",
    insurancePlanId: planUnimed,
    diagnoses: "TEA (Transtorno do Espectro Autista)",
  }, patientTs);

  const patHelena = insertRow("Patient", {
    careStage: "Em atendimento",
    unitId: sede,
    fullName: "Helena Ferraz",
    birthDate: "2021-11-30",
    gender: "Feminino",
    status: "Ativo",
    specialties: "Modelo Denver (ESDM)",
    diagnoses: "TEA - intervenção precoce",
  }, patientTs);

  const patMiguel = insertRow("Patient", {
    careStage: "Plano terapêutico",
    unitId: sede,
    fullName: "Miguel Barbosa",
    birthDate: "2017-06-08",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Intervenção Comportamental ABA",
    diagnoses: "TDAH",
  }, patientTs);

  const patAlice = insertRow("Patient", {
    careStage: "Avaliação",
    unitId: guaira,
    fullName: "Alice Lima",
    birthDate: "2020-07-02",
    gender: "Feminino",
    status: "Em avaliação",
    specialties: "Terapia Ocupacional",
  }, patientTs);

  const patTheo = insertRow("Patient", {
    careStage: "Em atendimento",
    unitId: guaira,
    fullName: "Théo Ribeiro",
    birthDate: "2019-09-21",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Fonoaudiologia",
    diagnoses: "Atraso de fala",
  }, patientTs);

  const patLaura = insertRow("Patient", {
    careStage: "Reavaliação",
    unitId: terraRoxa,
    fullName: "Laura Nogueira",
    birthDate: "2018-02-17",
    gender: "Feminino",
    status: "Ativo",
    specialties: "Psicopedagogia",
    diagnoses: "Dificuldade de aprendizagem",
  }, patientTs);

  const patDavi = insertRow("Patient", {
    careStage: "Triagem",
    unitId: terraRoxa,
    fullName: "Davi Antunes",
    birthDate: "2020-01-09",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Psicologia",
  }, patientTs);

  insertRow("PatientResponsible", { patientId: patEnzo, responsibleId: respMarina });
  insertRow("PatientResponsible", { patientId: patAlice, responsibleId: respEduardo });
  insertRow("PatientResponsible", { patientId: patLaura, responsibleId: respSilvia });
  insertRow("PatientProfessional", { patientId: patEnzo, professionalId: profAba });
  insertRow("PatientProfessional", { patientId: patHelena, professionalId: profDenver });
  insertRow("PatientProfessional", { patientId: patTheo, professionalId: profFono });
  insertRow("PatientProfessional", { patientId: patAlice, professionalId: profTo });
  insertRow("PatientProfessional", { patientId: patLaura, professionalId: profPsicoped });

  // ---------- Sessões ----------
  const now = new Date();
  // Sessões caem em horário comercial, não na hora em que o seed rodou.
  const day = (n: number, hour = 9) => {
    const d = new Date(now.getTime() + n * 24 * 3600 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  insertRow("Session", {
    unitId: sede, patientId: patEnzo, professionalId: profAba,
    specialty: "Intervenção Comportamental ABA", sessionDate: day(1, 9), status: "Agendada",
    goals: "Ampliar repertório de comunicação funcional",
  });
  insertRow("Session", {
    unitId: sede, patientId: patHelena, professionalId: profDenver,
    specialty: "Modelo Denver (ESDM)", sessionDate: day(2, 14), status: "Agendada",
    goals: "Estimular atenção compartilhada em brincadeira dirigida",
  });
  insertRow("Session", {
    unitId: sede, patientId: patMiguel, professionalId: profAba,
    specialty: "Intervenção Comportamental ABA", sessionDate: day(4, 10), status: "Agendada",
  });
  insertRow("Session", {
    unitId: sede, patientId: patEnzo, professionalId: profAba,
    specialty: "Intervenção Comportamental ABA", sessionDate: day(-1, 15), status: "Realizada",
    evolutionText: "Boa adesão às atividades propostas; aumento de pedidos espontâneos.",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patTheo, professionalId: profFono,
    specialty: "Fonoaudiologia", sessionDate: day(2, 8), status: "Agendada",
    goals: "Articulação dos fonemas /r/ e /l/",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patAlice, professionalId: profTo,
    specialty: "Terapia Ocupacional", sessionDate: day(5, 16), status: "Agendada",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patTheo, professionalId: profFono,
    specialty: "Fonoaudiologia", sessionDate: day(-2, 11), status: "Relatório pendente",
  });
  insertRow("Session", {
    unitId: terraRoxa, patientId: patLaura, professionalId: profPsicoped,
    specialty: "Psicopedagogia", sessionDate: day(3, 13), status: "Agendada",
    goals: "Estratégias de leitura e compreensão de texto",
  });
  insertRow("Session", {
    unitId: terraRoxa, patientId: patDavi, professionalId: profPsi,
    specialty: "Psicologia", sessionDate: day(6, 9), status: "Agendada",
  });

  // ---------- Tabela de serviços ----------
  insertRow("ServiceItem", { name: "Sessão de Intervenção ABA", specialty: "Intervenção Comportamental ABA", price: 190, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão Modelo Denver (ESDM)", specialty: "Modelo Denver (ESDM)", price: 200, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Terapia Ocupacional", specialty: "Terapia Ocupacional", price: 180, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Fonoaudiologia", specialty: "Fonoaudiologia", price: 170, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Psicopedagogia", specialty: "Psicopedagogia", price: 170, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Psicologia", specialty: "Psicologia", price: 170, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Pacote Fonoaudiologia (10 sessões)", specialty: "Fonoaudiologia", price: 1600, sessionDuration: 50, packageSessions: 10, active: 1 });

  // ---------- Financeiro ----------
  const refMonth = now.toISOString().slice(0, 7);
  const dayOfMonth = (d: number) =>
    new Date(now.getFullYear(), now.getMonth(), d).toISOString().slice(0, 10);

  insertRow("Invoice", {
    unitId: sede, patientId: patEnzo, responsibleId: respMarina,
    amount: 760, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(8), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: sede, patientId: patHelena,
    amount: 800, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Cartão de crédito", paymentDate: dayOfMonth(9), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: sede, patientId: patMiguel,
    amount: 570, dueDate: dayOfMonth(20), status: "Pendente", referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: guaira, patientId: patTheo,
    amount: 680, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(7), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: guaira, patientId: patAlice, responsibleId: respEduardo,
    amount: 540, dueDate: dayOfMonth(20), status: "Pendente", referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: terraRoxa, patientId: patLaura, responsibleId: respSilvia,
    amount: 680, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(10), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: terraRoxa, patientId: patDavi,
    amount: 510, dueDate: dayOfMonth(5), status: "Atrasado", referenceMonth: refMonth,
  });

  // ---------- Leads ----------
  const leadFernanda = insertRow("Lead", {
    unitId: sede,
    name: "Fernanda Costa",
    email: "fernanda.costa@example.com",
    phone: "(67) 99333-4444",
    status: "Novo", origin: "Instagram",
    interestedSpecialty: "Intervenção Comportamental ABA", priority: "Alta",
    message: "Gostaria de agendar uma avaliação inicial para meu filho de 5 anos.",
  });
  insertRow("Lead", {
    unitId: sede,
    name: "Bruno Martins",
    email: "bruno.martins@example.com",
    phone: "(67) 99444-5555",
    status: "Em contato", origin: "Site",
    interestedSpecialty: "Modelo Denver (ESDM)", priority: "Media",
  });
  insertRow("Lead", {
    unitId: guaira,
    name: "Patrícia Almeida",
    email: "patricia.almeida@example.com",
    phone: "(44) 99555-7777",
    status: "Novo", origin: "Indicação",
    interestedSpecialty: "Fonoaudiologia", priority: "Alta",
  });
  insertRow("Lead", {
    unitId: terraRoxa,
    name: "Rodrigo Steffen",
    email: "rodrigo.steffen@example.com",
    phone: "(44) 99666-8888",
    status: "Em contato", origin: "WhatsApp",
    interestedSpecialty: "Psicopedagogia", priority: "Media",
  });

  // ---------- Lista de espera ----------
  insertRow("Waitlist", {
    unitId: sede, name: "Sophia Almeida", phone: "(67) 99555-6666",
    desiredSpecialty: "Modelo Denver (ESDM)", priority: "Alta",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });
  insertRow("Waitlist", {
    unitId: guaira, name: "Pedro Kraus", phone: "(44) 99777-1234",
    desiredSpecialty: "Terapia Ocupacional", priority: "Media",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });
  insertRow("Waitlist", {
    unitId: terraRoxa, name: "Isabel Ortiz", phone: "(44) 99888-4321",
    desiredSpecialty: "Psicologia", priority: "Baixa",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });

  // ---------- Tarefas ----------
  insertRow("Task", {
    unitId: sede,
    title: "Ligar para responsável do Enzo sobre reavaliação",
    status: "Pendente", priority: "Alta",
    assignedToId: profAba, relatedPatientId: patEnzo,
    dueDate: day(2).slice(0, 10),
  });
  insertRow("Task", {
    unitId: guaira,
    title: "Enviar relatório de evolução do Théo para a escola",
    status: "Em andamento", priority: "Media",
    assignedToId: profFono, relatedPatientId: patTheo,
    dueDate: day(4).slice(0, 10),
  });
  insertRow("Task", {
    unitId: terraRoxa,
    title: "Cobrar fatura em atraso do Davi",
    status: "Pendente", priority: "Alta",
    relatedPatientId: patDavi,
    dueDate: day(1).slice(0, 10),
  });

  // ---------- Interações ----------
  insertRow("Interaction", {
    unitId: sede,
    contactType: "Lead", relatedLeadId: leadFernanda,
    channel: "Instagram", direction: "Recebido",
    summary: "Lead entrou em contato pelo Instagram perguntando sobre avaliação inicial.",
    interactionDate: nowIso(),
  });

  // ---------- Satisfação ----------
  insertRow("SatisfactionSurvey", {
    patientId: patEnzo, rating: 9,
    comments: "Equipe muito atenciosa, meu filho adorou a sessão.",
    surveyDate: now.toISOString().slice(0, 10),
  });
  insertRow("SatisfactionSurvey", {
    patientId: patTheo, rating: 10,
    comments: "Evolução visível na fala em poucos meses.",
    surveyDate: now.toISOString().slice(0, 10),
  });
  insertRow("SatisfactionSurvey", {
    patientId: patLaura, rating: 8,
    surveyDate: now.toISOString().slice(0, 10),
  });

  // ---------- Conta de profissional, para demonstrar o acesso restrito ----------
  // Vinculada ao cadastro da Dra. Camila: ao entrar com ela, o sistema mostra
  // apenas os pacientes que ela atende.
  insertRow(
    "User",
    {
      name: "Camila Rocha",
      email: "camila@clinickidsaber.com.br",
      passwordHash,
      role: "PROFISSIONAL",
      professionalId: profAba,
      title: "Dra.",
      jobTitle: "Analista do Comportamento (ABA)",
      unitId: sede,
      active: 1,
      mustChangePassword: 0,
    },
    { withTimestamps: true }
  );

  insertRow(
    "User",
    {
      name: "Recepção Mundo Novo",
      email: "recepcao@clinickidsaber.com.br",
      passwordHash,
      role: "RECEPCAO",
      jobTitle: "Recepcionista",
      unitId: sede,
      active: 1,
      mustChangePassword: 0,
    },
    { withTimestamps: true }
  );

  console.log("Seed concluído com sucesso.");
  console.log("Login: admin@clinickidsaber.com.br / senha: kidsaber123");
}

if (require.main === module) {
  ensureSeeded();
}
