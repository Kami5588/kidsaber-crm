CREATE TABLE IF NOT EXISTS Unit (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PR',
  address TEXT,
  phone TEXT,
  email TEXT,
  isMain INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Ativo',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  professionalId TEXT,
  responsibleId TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Patient (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  fullName TEXT NOT NULL,
  birthDate TEXT NOT NULL,
  gender TEXT,
  diagnoses TEXT,
  specialties TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  photoUrl TEXT,
  notes TEXT,
  cpf TEXT,
  address TEXT,
  emergencyContact TEXT,
  insuranceCardNumber TEXT,
  insurancePlanId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Responsible (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  cpf TEXT,
  address TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PatientResponsible (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  responsibleId TEXT NOT NULL,
  UNIQUE(patientId, responsibleId)
);

CREATE TABLE IF NOT EXISTS Professional (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT NOT NULL,
  councilNumber TEXT,
  bio TEXT,
  photoUrl TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PatientProfessional (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  professionalId TEXT NOT NULL,
  UNIQUE(patientId, professionalId)
);

CREATE TABLE IF NOT EXISTS Session (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  patientId TEXT NOT NULL,
  professionalId TEXT NOT NULL,
  specialty TEXT NOT NULL,
  sessionDate TEXT NOT NULL,
  durationMinutes INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'Agendada',
  evolutionText TEXT,
  goals TEXT,
  nextSteps TEXT,
  notesInternal TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Lead (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'Novo',
  origin TEXT,
  interestedSpecialty TEXT,
  priority TEXT NOT NULL DEFAULT 'Media',
  assignedToId TEXT,
  followUpDate TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS InsurancePlan (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  contactPhone TEXT,
  contactEmail TEXT,
  coverageSpecialties TEXT,
  reimbursementType TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ServiceItem (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  sessionDuration INTEGER NOT NULL DEFAULT 50,
  price REAL NOT NULL,
  packageSessions INTEGER,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Invoice (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  patientId TEXT NOT NULL,
  responsibleId TEXT,
  referenceMonth TEXT,
  amount REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  dueDate TEXT NOT NULL,
  paymentDate TEXT,
  paymentMethod TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  insurancePlanId TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Task (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assignedToId TEXT,
  relatedPatientId TEXT,
  relatedLeadId TEXT,
  dueDate TEXT,
  priority TEXT NOT NULL DEFAULT 'Media',
  status TEXT NOT NULL DEFAULT 'Pendente',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Interaction (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  contactType TEXT,
  relatedLeadId TEXT,
  relatedPatientId TEXT,
  relatedResponsibleId TEXT,
  channel TEXT NOT NULL,
  direction TEXT,
  summary TEXT NOT NULL,
  interactionDate TEXT NOT NULL,
  userId TEXT,
  followUpDate TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Waitlist (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  unitId TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  desiredSpecialty TEXT,
  priority TEXT NOT NULL DEFAULT 'Media',
  addedDate TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aguardando',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS Document (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  uploadDate TEXT NOT NULL,
  uploadedById TEXT,
  visibleToResponsible INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS SatisfactionSurvey (
  createdAt TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  sessionId TEXT,
  rating REAL NOT NULL,
  comments TEXT,
  surveyDate TEXT NOT NULL
);

-- ============================================================
-- LGPD: auditoria de acesso e proteção do login
-- ============================================================

-- Registro de quem acessou o quê. Exigido para demonstrar controle sobre
-- dados sensíveis de saúde (LGPD art. 37 e 46).
CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userEmail TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entityId TEXT,
  detail TEXT,
  ip TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON AuditLog(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON AuditLog(entity, entityId);

-- Tentativas de login, para bloquear ataque de força bruta. Fica em tabela
-- (e não em memória) para sobreviver a reinícios do container.
CREATE TABLE IF NOT EXISTS LoginAttempt (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_identifier ON LoginAttempt(identifier, createdAt DESC);
