import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Diretório de dados.
 *
 * Em produção o Railway monta um volume persistente e define DATA_DIR (ex.: /data).
 * Sem essa variável o banco fica em ./data, que é efêmero no container e é
 * apagado a cada deploy — aceitável só em desenvolvimento local.
 */
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const dbPath = path.join(dataDir, "kidsaber.db");

declare global {
  var __kidsaberDb: DatabaseSync | undefined;
}

function createConnection() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  let database: DatabaseSync | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 10 && !database; attempt++) {
    try {
      database = new DatabaseSync(dbPath);
    } catch (err) {
      lastErr = err;
      // Espera crescente entre as tentativas. Sem isso as 10 tentativas
      // aconteciam no mesmo instante e nenhuma dava tempo do outro processo
      // liberar o arquivo.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (attempt + 1));
    }
  }
  if (!database) throw lastErr;
  database.exec("PRAGMA busy_timeout = 10000;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  const schema = fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf-8");
  database.exec(schema);
  runMigrations(database);
  return database;
}

/**
 * Migrações idempotentes para bancos que já existem em produção.
 *
 * O schema.sql só usa CREATE TABLE IF NOT EXISTS, então colunas novas
 * adicionadas depois nunca chegariam a um banco já criado. Aqui cada coluna
 * é conferida contra o PRAGMA table_info e adicionada se faltar.
 */
function runMigrations(database: DatabaseSync) {
  const addColumn = (table: string, column: string, definition: string) => {
    const cols = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (cols.length === 0) return; // tabela ainda não existe
    if (cols.some((c) => c.name === column)) return; // já migrada
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  };

  for (const table of UNIT_SCOPED_TABLES) {
    addColumn(table, "unitId", "TEXT");
  }

  // Perfis de acesso e identificação do usuário
  addColumn("User", "professionalId", "TEXT");
  addColumn("User", "title", "TEXT");          // tratamento: Dra., Dr., Prof.ª...
  addColumn("User", "jobTitle", "TEXT");       // cargo exibido: Fonoaudióloga...
  addColumn("User", "active", "INTEGER NOT NULL DEFAULT 1");
  addColumn("User", "mustChangePassword", "INTEGER NOT NULL DEFAULT 0");
  addColumn("User", "unitId", "TEXT");

  // Nomenclatura também no cadastro do profissional
  addColumn("Professional", "title", "TEXT");
  addColumn("Professional", "jobTitle", "TEXT");

  // Etapa do atendimento
  addColumn("Patient", "careStage", "TEXT");

  // Login por conta Google
  addColumn("User", "authProvider", "TEXT");   // "credentials" ou "google"
  addColumn("User", "picture", "TEXT");
  addColumn("User", "lastLoginAt", "TEXT");

  // Arquivos anexados de verdade (e não só um link colado)
  addColumn("Document", "storedName", "TEXT");
  addColumn("Document", "originalName", "TEXT");
  addColumn("Document", "mimeType", "TEXT");
  addColumn("Document", "sizeBytes", "INTEGER");
  addColumn("Document", "unitId", "TEXT");

  // Recrutamento
  addColumn("JobApplication", "interestedUnits", "TEXT");
  addColumn("JobApplication", "resumeStoredName", "TEXT");
  addColumn("JobApplication", "resumeOriginalName", "TEXT");
  addColumn("JobApplication", "resumeMimeType", "TEXT");
  addColumn("JobApplication", "resumeSizeBytes", "INTEGER");

  corrigirJobIdObrigatorio(database);
}

/**
 * Torna JobApplication.jobId opcional em bancos criados com ele obrigatório.
 *
 * A primeira versão da tabela exigia jobId, mas a candidatura espontânea — o
 * currículo mandado ao banco de talentos, sem vaga aberta — não tem vaga a
 * apontar. Com a coluna obrigatória, toda candidatura era recusada pelo banco.
 *
 * SQLite não remove um NOT NULL com ALTER TABLE: é preciso recriar a tabela e
 * copiar as linhas. Feito dentro de uma transação, para que uma falha no meio
 * não deixe a tabela pela metade.
 */
function corrigirJobIdObrigatorio(database: DatabaseSync) {
  const cols = database.prepare("PRAGMA table_info(JobApplication)").all() as Array<{
    name: string;
    notnull: number;
  }>;
  if (cols.length === 0) return; // tabela ainda não existe
  if (!cols.some((c) => c.name === "jobId" && c.notnull === 1)) return; // já corrigida

  // Só copia colunas presentes nos dois lados; um banco antigo pode não ter as
  // colunas de currículo em arquivo, e nomear uma coluna inexistente aborta tudo.
  const nomes = new Set(cols.map((c) => c.name));
  const comuns = [
    "id", "jobId", "candidateName", "candidateEmail", "candidatePhone",
    "interestedUnits", "resumeStoredName", "resumeOriginalName",
    "resumeMimeType", "resumeSizeBytes", "notes", "status", "createdAt",
  ].filter((c) => nomes.has(c));

  database.exec("BEGIN");
  try {
    database.exec(`
      CREATE TABLE JobApplication_novo (
        id TEXT PRIMARY KEY,
        jobId TEXT,
        candidateName TEXT NOT NULL,
        candidateEmail TEXT NOT NULL,
        candidatePhone TEXT NOT NULL,
        interestedUnits TEXT,
        resumeStoredName TEXT,
        resumeOriginalName TEXT,
        resumeMimeType TEXT,
        resumeSizeBytes INTEGER,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'Novo',
        createdAt TEXT NOT NULL,
        FOREIGN KEY(jobId) REFERENCES JobOpening(id)
      )
    `);
    database.exec(
      `INSERT INTO JobApplication_novo (${comuns.join(",")})
       SELECT ${comuns.join(",")} FROM JobApplication`
    );
    database.exec("DROP TABLE JobApplication");
    database.exec("ALTER TABLE JobApplication_novo RENAME TO JobApplication");
    database.exec("CREATE INDEX IF NOT EXISTS idx_app_job ON JobApplication(jobId, createdAt DESC)");
    database.exec("CREATE INDEX IF NOT EXISTS idx_app_email ON JobApplication(candidateEmail)");
    database.exec("COMMIT");
    console.log("JobApplication migrada: jobId passou a ser opcional.");
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}

/** Tabelas cujos registros pertencem a uma unidade da clínica. */
export const UNIT_SCOPED_TABLES = [
  "Patient",
  "Professional",
  "Session",
  "Lead",
  "Invoice",
  "Waitlist",
  "Task",
  "Interaction",
] as const;

function getDb(): DatabaseSync {
  if (!global.__kidsaberDb) {
    global.__kidsaberDb = createConnection();
  }
  return global.__kidsaberDb;
}

/**
 * Conexão preguiçosa.
 *
 * Abrir o banco no import fazia o `next build` falhar com "database is
 * locked": o Next carrega os módulos das páginas em vários workers paralelos e
 * todos tentavam abrir e inicializar o mesmo arquivo ao mesmo tempo. Com o
 * proxy, o arquivo só é tocado quando alguém realmente executa uma consulta —
 * o que nunca acontece durante a compilação.
 */
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop, receiver) {
    const real = getDb() as any;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function newId(): string { return crypto.randomUUID(); }
export function nowIso(): string { return new Date().toISOString(); }
