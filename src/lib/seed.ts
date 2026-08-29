import bcrypt from "bcryptjs";
import { db, nowIso } from "./db";
import { insertRow, rawAll } from "./orm";

/**
 * Unidades da rede.
 *
 * Roda separado do seed de demonstração porque bancos que já existem em
 * produção nunca passariam pelo ensureSeeded (que só age em base vazia) e
 * ficariam sem nenhuma unidade cadastrada.
 */
export function ensureUnits(): Record<string, string> {
  const existing = rawAll("SELECT id, name FROM Unit");
  if (existing.length > 0) {
    return Object.fromEntries(existing.map((u) => [u.name, u.id]));
  }

  const matriz = insertRow("Unit", {
    name: "Marechal Cândido Rondon",
    city: "Marechal Cândido Rondon",
    state: "PR",
    address: "Av. Rio Grande do Sul, 1500 - Centro",
    phone: "(45) 3254-0000",
    email: "contato@kidsaber.com.br",
    isMain: 1,
    status: "Ativo",
  });
  const guaira = insertRow("Unit", {
    name: "Guaíra",
    city: "Guaíra",
    state: "PR",
    address: "Rua XV de Novembro, 320 - Centro",
    phone: "(44) 3642-0000",
    email: "guaira@kidsaber.com.br",
    isMain: 0,
    status: "Ativo",
  });
  const mundoNovo = insertRow("Unit", {
    name: "Mundo Novo",
    city: "Mundo Novo",
    state: "MS",
    address: "Av. Campo Grande, 580 - Centro",
    phone: "(67) 3474-0000",
    email: "mundonovo@kidsaber.com.br",
    isMain: 0,
    status: "Ativo",
  });

  console.log("Unidades criadas: Marechal Cândido Rondon (matriz), Guaíra, Mundo Novo.");
  return { matriz, guaira, mundoNovo };
}

export function ensureSeeded() {
  const units = ensureUnits();
  const matriz = units.matriz ?? units["Marechal Cândido Rondon"];
  const guaira = units.guaira ?? units["Guaíra"];
  const mundoNovo = units.mundoNovo ?? units["Mundo Novo"];

  const userCount = (db.prepare("SELECT COUNT(*) as c FROM User").get() as any).c;
  if (userCount > 0) return;

  const passwordHash = bcrypt.hashSync("kidsaber123", 10);
  insertRow(
    "User",
    { name: "Administradora KidSaber", email: "admin@kidsaber.com.br", passwordHash, role: "ADMIN" },
    { withTimestamps: true }
  );

  // ---------- Profissionais ----------
  const profTO = insertRow("Professional", {
    unitId: matriz,
    fullName: "Dra. Camila Rocha",
    email: "camila@kidsaber.com.br",
    phone: "(45) 99125-4410",
    specialty: "Terapia Ocupacional",
    councilNumber: "CREFITO 12345",
    status: "Ativo",
  });
  const profPsi = insertRow("Professional", {
    unitId: matriz,
    fullName: "Dr. Rafael Souza",
    email: "rafael@kidsaber.com.br",
    phone: "(45) 99135-2175",
    specialty: "Psicologia",
    councilNumber: "CRP 08/12345",
    status: "Ativo",
  });
  const profFono = insertRow("Professional", {
    unitId: guaira,
    fullName: "Dra. Juliana Alves",
    email: "juliana@kidsaber.com.br",
    phone: "(44) 99840-0554",
    specialty: "Fonoaudiologia",
    councilNumber: "CRFa 12345",
    status: "Ativo",
  });
  const profPsico = insertRow("Professional", {
    unitId: guaira,
    fullName: "Dra. Letícia Brandt",
    email: "leticia@kidsaber.com.br",
    phone: "(44) 99712-8890",
    specialty: "Psicopedagogia",
    councilNumber: "CRP 08/54321",
    status: "Ativo",
  });
  const profFisio = insertRow("Professional", {
    unitId: mundoNovo,
    fullName: "Dr. Anderson Vieira",
    email: "anderson@kidsaber.com.br",
    phone: "(67) 99604-1122",
    specialty: "Fisioterapia",
    councilNumber: "CREFITO 67890",
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
    phone: "(45) 99111-2222",
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
    phone: "(67) 99333-1010",
    relationship: "Mãe",
  });

  // ---------- Pacientes ----------
  const patientTs = { withTimestamps: true, timestampFields: ["createdAt", "updatedAt"] };

  const patEnzo = insertRow("Patient", {
    unitId: matriz,
    fullName: "Enzo Ferreira",
    birthDate: "2019-03-14",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Terapia Ocupacional,Fonoaudiologia",
    insurancePlanId: planUnimed,
    diagnoses: "TEA (Transtorno do Espectro Autista)",
  }, patientTs);

  const patHelena = insertRow("Patient", {
    unitId: matriz,
    fullName: "Helena Ferraz",
    birthDate: "2018-11-30",
    gender: "Feminino",
    status: "Ativo",
    specialties: "Psicologia",
    diagnoses: "Ansiedade infantil",
  }, patientTs);

  const patMiguel = insertRow("Patient", {
    unitId: matriz,
    fullName: "Miguel Barbosa",
    birthDate: "2017-06-08",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Terapia Ocupacional",
    diagnoses: "TDAH",
  }, patientTs);

  const patAlice = insertRow("Patient", {
    unitId: guaira,
    fullName: "Alice Lima",
    birthDate: "2020-07-02",
    gender: "Feminino",
    status: "Em avaliação",
    specialties: "Psicologia",
  }, patientTs);

  const patTheo = insertRow("Patient", {
    unitId: guaira,
    fullName: "Théo Ribeiro",
    birthDate: "2019-09-21",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Fonoaudiologia",
    diagnoses: "Atraso de fala",
  }, patientTs);

  const patLaura = insertRow("Patient", {
    unitId: mundoNovo,
    fullName: "Laura Nogueira",
    birthDate: "2018-02-17",
    gender: "Feminino",
    status: "Ativo",
    specialties: "Fisioterapia",
    diagnoses: "Atraso no desenvolvimento motor",
  }, patientTs);

  const patDavi = insertRow("Patient", {
    unitId: mundoNovo,
    fullName: "Davi Antunes",
    birthDate: "2020-01-09",
    gender: "Masculino",
    status: "Ativo",
    specialties: "Fisioterapia",
  }, patientTs);

  insertRow("PatientResponsible", { patientId: patEnzo, responsibleId: respMarina });
  insertRow("PatientResponsible", { patientId: patAlice, responsibleId: respEduardo });
  insertRow("PatientResponsible", { patientId: patLaura, responsibleId: respSilvia });
  insertRow("PatientProfessional", { patientId: patEnzo, professionalId: profTO });
  insertRow("PatientProfessional", { patientId: patTheo, professionalId: profFono });
  insertRow("PatientProfessional", { patientId: patAlice, professionalId: profPsi });
  insertRow("PatientProfessional", { patientId: patLaura, professionalId: profFisio });

  // ---------- Sessões ----------
  const now = new Date();
  // Sessoes caem em horario comercial, nao na hora em que o seed rodou.
  const day = (n: number, hour = 9) => {
    const d = new Date(now.getTime() + n * 24 * 3600 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  insertRow("Session", {
    unitId: matriz, patientId: patEnzo, professionalId: profTO,
    specialty: "Terapia Ocupacional", sessionDate: day(1, 9), status: "Agendada",
    goals: "Trabalhar coordenação motora fina",
  });
  insertRow("Session", {
    unitId: matriz, patientId: patHelena, professionalId: profPsi,
    specialty: "Psicologia", sessionDate: day(2, 14), status: "Agendada",
    goals: "Manejo de ansiedade em ambiente escolar",
  });
  insertRow("Session", {
    unitId: matriz, patientId: patMiguel, professionalId: profTO,
    specialty: "Terapia Ocupacional", sessionDate: day(4, 10), status: "Agendada",
  });
  insertRow("Session", {
    unitId: matriz, patientId: patEnzo, professionalId: profTO,
    specialty: "Terapia Ocupacional", sessionDate: day(-1, 15), status: "Realizada",
    evolutionText: "Boa evolução na preensão de objetos pequenos.",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patTheo, professionalId: profFono,
    specialty: "Fonoaudiologia", sessionDate: day(2, 8), status: "Agendada",
    goals: "Articulação dos fonemas /r/ e /l/",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patAlice, professionalId: profPsico,
    specialty: "Psicopedagogia", sessionDate: day(5, 16), status: "Agendada",
  });
  insertRow("Session", {
    unitId: guaira, patientId: patTheo, professionalId: profFono,
    specialty: "Fonoaudiologia", sessionDate: day(-2, 11), status: "Relatório pendente",
  });
  insertRow("Session", {
    unitId: mundoNovo, patientId: patLaura, professionalId: profFisio,
    specialty: "Fisioterapia", sessionDate: day(3, 13), status: "Agendada",
    goals: "Fortalecimento de tronco e equilíbrio",
  });
  insertRow("Session", {
    unitId: mundoNovo, patientId: patDavi, professionalId: profFisio,
    specialty: "Fisioterapia", sessionDate: day(6, 9), status: "Agendada",
  });

  // ---------- Tabela de serviços ----------
  insertRow("ServiceItem", { name: "Sessão de Terapia Ocupacional", specialty: "Terapia Ocupacional", price: 180, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Psicologia", specialty: "Psicologia", price: 170, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Fonoaudiologia", specialty: "Fonoaudiologia", price: 170, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Sessão de Fisioterapia", specialty: "Fisioterapia", price: 160, sessionDuration: 50, active: 1 });
  insertRow("ServiceItem", { name: "Pacote Fonoaudiologia (10 sessões)", specialty: "Fonoaudiologia", price: 1600, sessionDuration: 50, packageSessions: 10, active: 1 });

  // ---------- Financeiro ----------
  const refMonth = now.toISOString().slice(0, 7);
  const dayOfMonth = (d: number) =>
    new Date(now.getFullYear(), now.getMonth(), d).toISOString().slice(0, 10);

  insertRow("Invoice", {
    unitId: matriz, patientId: patEnzo, responsibleId: respMarina,
    amount: 720, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(8), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: matriz, patientId: patHelena,
    amount: 680, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Cartão de crédito", paymentDate: dayOfMonth(9), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: matriz, patientId: patMiguel,
    amount: 540, dueDate: dayOfMonth(20), status: "Pendente", referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: guaira, patientId: patTheo,
    amount: 680, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(7), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: guaira, patientId: patAlice, responsibleId: respEduardo,
    amount: 510, dueDate: dayOfMonth(20), status: "Pendente", referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: mundoNovo, patientId: patLaura, responsibleId: respSilvia,
    amount: 640, dueDate: dayOfMonth(10), status: "Pago",
    paymentMethod: "Pix", paymentDate: dayOfMonth(10), referenceMonth: refMonth,
  });
  insertRow("Invoice", {
    unitId: mundoNovo, patientId: patDavi,
    amount: 480, dueDate: dayOfMonth(5), status: "Atrasado", referenceMonth: refMonth,
  });

  // ---------- Leads ----------
  const leadFernanda = insertRow("Lead", {
    unitId: matriz,
    name: "Fernanda Costa",
    email: "fernanda.costa@example.com",
    phone: "(45) 99333-4444",
    status: "Novo", origin: "Instagram",
    interestedSpecialty: "Psicopedagogia", priority: "Alta",
    message: "Gostaria de agendar uma avaliação inicial para meu filho de 5 anos.",
  });
  insertRow("Lead", {
    unitId: matriz,
    name: "Bruno Martins",
    email: "bruno.martins@example.com",
    phone: "(45) 99444-5555",
    status: "Em contato", origin: "Site",
    interestedSpecialty: "Fonoaudiologia", priority: "Media",
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
    unitId: mundoNovo,
    name: "Rodrigo Steffen",
    email: "rodrigo.steffen@example.com",
    phone: "(67) 99666-8888",
    status: "Em contato", origin: "WhatsApp",
    interestedSpecialty: "Fisioterapia", priority: "Media",
  });

  // ---------- Lista de espera ----------
  insertRow("Waitlist", {
    unitId: matriz, name: "Sophia Almeida", phone: "(45) 99555-6666",
    desiredSpecialty: "Terapia Ocupacional", priority: "Alta",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });
  insertRow("Waitlist", {
    unitId: guaira, name: "Pedro Kraus", phone: "(44) 99777-1234",
    desiredSpecialty: "Psicologia", priority: "Media",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });
  insertRow("Waitlist", {
    unitId: mundoNovo, name: "Isabel Ortiz", phone: "(67) 99888-4321",
    desiredSpecialty: "Fisioterapia", priority: "Baixa",
    addedDate: now.toISOString().slice(0, 10), status: "Aguardando",
  });

  // ---------- Tarefas ----------
  insertRow("Task", {
    unitId: matriz,
    title: "Ligar para responsável do Enzo sobre reavaliação",
    status: "Pendente", priority: "Alta",
    assignedToId: profTO, relatedPatientId: patEnzo,
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
    unitId: mundoNovo,
    title: "Cobrar fatura em atraso do Davi",
    status: "Pendente", priority: "Alta",
    relatedPatientId: patDavi,
    dueDate: day(1).slice(0, 10),
  });

  // ---------- Interações ----------
  insertRow("Interaction", {
    unitId: matriz,
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

  console.log("Seed concluído com sucesso.");
  console.log("Login: admin@kidsaber.com.br / senha: kidsaber123");
}

if (require.main === module) {
  ensureSeeded();
}
