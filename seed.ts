import bcrypt from "bcryptjs";
import { db, nowIso } from "./db";
import { insertRow } from "./orm";

export function ensureSeeded() {
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM User").get() as any).c;
  if (userCount > 0) return;

  const passwordHash = bcrypt.hashSync("kidsaber123", 10);
  insertRow(
    "User",
    { name: "Administrador KidSaber", email: "admin@kidsaber.com.br", passwordHash, role: "ADMIN" },
    { withTimestamps: true }
  );

  const prof1 = insertRow("Professional", {
    fullName: "Dra. Camila Rocha",
    email: "camila@kidsaber.com.br",
    phone: "(44) 99125-4410",
    specialty: "Terapia Ocupacional",
    councilNumber: "CREFITO 12345",
    status: "Ativo",
  });
  const prof2 = insertRow("Professional", {
    fullName: "Dr. Rafael Souza",
    email: "rafael@kidsaber.com.br",
    phone: "(44) 99135-2175",
    specialty: "Psicologia",
    councilNumber: "CRP 08/12345",
    status: "Ativo",
  });
  const prof3 = insertRow("Professional", {
    fullName: "Dra. Juliana Alves",
    email: "juliana@kidsaber.com.br",
    phone: "(44) 99840-0554",
    specialty: "Fonoaudiologia",
    councilNumber: "CRFa 12345",
    status: "Ativo",
  });

  const plan1 = insertRow("InsurancePlan", {
    name: "Unimed",
    reimbursementType: "Reembolso",
    status: "Ativo",
    coverageSpecialties: "Fonoaudiologia,Psicologia,Terapia Ocupacional",
  });
  insertRow("InsurancePlan", { name: "Particular", reimbursementType: "Não aceito", status: "Ativo" });

  const resp1 = insertRow("Responsible", {
    fullName: "Marina Ferreira",
    email: "marina.ferreira@example.com",
    phone: "(44) 99111-2222",
    relationship: "Mãe",
  });
  const resp2 = insertRow("Responsible", {
    fullName: "Eduardo Lima",
    email: "eduardo.lima@example.com",
    phone: "(44) 99222-3333",
    relationship: "Pai",
  });

  const pat1 = insertRow(
    "Patient",
    {
      fullName: "Enzo Ferreira",
      birthDate: "2019-03-14",
      gender: "Masculino",
      status: "Ativo",
      specialties: "Terapia Ocupacional,Fonoaudiologia",
      insurancePlanId: plan1,
      diagnoses: "TEA (Transtorno do Espectro Autista)",
    },
    { withTimestamps: true, timestampFields: ["createdAt", "updatedAt"] }
  );
  const pat2 = insertRow(
    "Patient",
    {
      fullName: "Alice Lima",
      birthDate: "2020-07-02",
      gender: "Feminino",
      status: "Em avaliação",
      specialties: "Psicologia",
    },
    { withTimestamps: true, timestampFields: ["createdAt", "updatedAt"] }
  );

  insertRow("PatientResponsible", { patientId: pat1, responsibleId: resp1 });
  insertRow("PatientResponsible", { patientId: pat2, responsibleId: resp2 });
  insertRow("PatientProfessional", { patientId: pat1, professionalId: prof1 });
  insertRow("PatientProfessional", { patientId: pat1, professionalId: prof3 });
  insertRow("PatientProfessional", { patientId: pat2, professionalId: prof2 });

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  insertRow("Session", {
    patientId: pat1,
    professionalId: prof1,
    specialty: "Terapia Ocupacional",
    sessionDate: inThreeDays,
    status: "Agendada",
    goals: "Trabalhar coordenação motora fina",
  });
  insertRow("Session", {
    patientId: pat1,
    professionalId: prof3,
    specialty: "Fonoaudiologia",
    sessionDate: yesterday,
    status: "Realizada",
    evolutionText: "Boa evolução na articulação de fonemas.",
  });

  insertRow("ServiceItem", { name: "Sessão de Terapia Ocupacional", specialty: "Terapia Ocupacional", price: 180, sessionDuration: 50 });
  insertRow("ServiceItem", { name: "Sessão de Psicologia", specialty: "Psicologia", price: 170, sessionDuration: 50 });
  insertRow("ServiceItem", { name: "Pacote Fonoaudiologia (10 sessões)", specialty: "Fonoaudiologia", price: 1600, sessionDuration: 50, packageSessions: 10 });

  insertRow("Invoice", {
    patientId: pat1,
    responsibleId: resp1,
    amount: 720,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString().slice(0, 10),
    status: "Pago",
    paymentMethod: "Pix",
    paymentDate: new Date(now.getFullYear(), now.getMonth(), 8).toISOString().slice(0, 10),
    referenceMonth: now.toISOString().slice(0, 7),
  });
  insertRow("Invoice", {
    patientId: pat2,
    responsibleId: resp2,
    amount: 680,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 20).toISOString().slice(0, 10),
    status: "Pendente",
    referenceMonth: now.toISOString().slice(0, 7),
  });

  const lead1 = insertRow("Lead", {
    name: "Fernanda Costa",
    email: "fernanda.costa@example.com",
    phone: "(44) 99333-4444",
    status: "Novo",
    origin: "Instagram",
    interestedSpecialty: "Psicopedagogia",
    priority: "Alta",
    message: "Gostaria de agendar uma avaliação inicial para meu filho de 5 anos.",
  });
  insertRow("Lead", {
    name: "Bruno Martins",
    email: "bruno.martins@example.com",
    phone: "(44) 99444-5555",
    status: "Em contato",
    origin: "Site",
    interestedSpecialty: "Fonoaudiologia",
    priority: "Media",
  });

  insertRow("Waitlist", {
    name: "Sophia Almeida",
    phone: "(44) 99555-6666",
    desiredSpecialty: "Terapia Ocupacional",
    priority: "Alta",
    addedDate: now.toISOString().slice(0, 10),
    status: "Aguardando",
  });

  insertRow("Task", {
    title: "Ligar para responsável do Enzo sobre reavaliação",
    status: "Pendente",
    priority: "Alta",
    assignedToId: prof1,
    relatedPatientId: pat1,
    dueDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  });

  insertRow("Interaction", {
    contactType: "Lead",
    relatedLeadId: lead1,
    channel: "Instagram",
    direction: "Recebido",
    summary: "Lead entrou em contato pelo Instagram perguntando sobre avaliação inicial.",
    interactionDate: nowIso(),
  });

  insertRow("SatisfactionSurvey", {
    patientId: pat1,
    rating: 9,
    comments: "Equipe muito atenciosa, filho adorou a sessão.",
    surveyDate: now.toISOString().slice(0, 10),
  });

  console.log("Seed concluído com sucesso.");
  console.log("Login: admin@kidsaber.com.br / senha: kidsaber123");
}

if (require.main === module) {
  ensureSeeded();
}
