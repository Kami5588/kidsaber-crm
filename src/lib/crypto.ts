import crypto from "node:crypto";

/**
 * Criptografia dos dados sensíveis em repouso (LGPD art. 46).
 *
 * Usa AES-256-GCM em vez de CBC: além de cifrar, o GCM autentica o conteúdo,
 * então um valor adulterado no banco falha na verificação em vez de devolver
 * lixo silenciosamente.
 *
 * Formato guardado: `enc:v1:<iv>:<tag>:<dados>`, tudo em base64. O prefixo
 * permite conviver com registros antigos ainda em texto puro — nada quebra
 * enquanto a base não é migrada.
 */

const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // recomendado para GCM

let cachedKey: Buffer | null = null;

/**
 * Deriva a chave de 32 bytes a partir de ENCRYPTION_KEY.
 *
 * Aceita hex de 64 caracteres (o formato gerado por `randomBytes(32).toString('hex')`)
 * ou qualquer outra string, que passa por scrypt. Isso evita a armadilha do
 * `Buffer.from(chave)` direto, que quebra quando a chave tem acento ou tamanho
 * diferente de 32 bytes.
 */
function getKey(): Buffer | null {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.trim() === "") return null;

  const value = raw.trim();

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    cachedKey = Buffer.from(value, "hex");
  } else {
    // Salt fixo: a chave precisa ser reproduzível entre reinícios, senão os
    // dados já gravados ficariam ilegíveis.
    cachedKey = crypto.scryptSync(value, "kidsaber-lgpd-v1", 32);
  }

  return cachedKey;
}

export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Cifra um texto. Sem chave configurada, devolve o valor original — o sistema
 * segue funcionando em desenvolvimento sem exigir configuração.
 */
export function encrypt(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === "") return plain ?? null;
  if (isEncrypted(plain)) return plain; // já cifrado, não cifrar duas vezes

  const key = getKey();
  if (!key) return plain;

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`;
}

/**
 * Decifra um valor. Texto puro (registro anterior à criptografia) passa direto.
 *
 * Falha na decifragem devolve um aviso legível em vez de derrubar a página:
 * um prontuário ilegível é um problema a resolver, não motivo para o sistema
 * inteiro parar durante um atendimento.
 */
export function decrypt(stored: string | null | undefined): string | null {
  if (stored === null || stored === undefined || stored === "") return stored ?? null;
  if (!isEncrypted(stored)) return String(stored);

  const key = getKey();
  if (!key) return "[dado cifrado: chave de criptografia não configurada]";

  try {
    const [, , ivB64, tagB64, dataB64] = stored.split(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const out = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return out.toString("utf8");
  } catch {
    return "[dado cifrado ilegível: verifique a ENCRYPTION_KEY]";
  }
}

/**
 * Campos cifrados em repouso, por tabela.
 *
 * Só entram campos de conteúdo livre: nomes e datas precisam continuar
 * pesquisáveis e ordenáveis no SQL, e cifrá-los inviabilizaria busca e agenda.
 */
export const ENCRYPTED_FIELDS: Record<string, readonly string[]> = {
  Patient: ["diagnoses", "notes"],
  Session: ["evolutionText", "goals", "nextSteps", "notesInternal"],
  Document: ["fileUrl"],
  Interaction: ["summary"],
};

export function encryptedFieldsFor(table: string): readonly string[] {
  return ENCRYPTED_FIELDS[table] ?? [];
}

/** Cifra os campos sensíveis de um registro antes de gravar. */
export function encryptRow(table: string, row: Record<string, any>): Record<string, any> {
  const fields = encryptedFieldsFor(table);
  if (fields.length === 0) return row;

  const out = { ...row };
  for (const f of fields) {
    if (f in out) out[f] = encrypt(out[f]);
  }
  return out;
}

/** Decifra os campos sensíveis de um registro lido do banco. */
export function decryptRow<T extends Record<string, any>>(table: string, row: T): T {
  const fields = encryptedFieldsFor(table);
  if (fields.length === 0) return row;

  const out: Record<string, any> = { ...row };
  for (const f of fields) {
    if (f in out) out[f] = decrypt(out[f]);
  }
  return out as T;
}

/** Gera uma chave nova, no formato aceito por ENCRYPTION_KEY. */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Nomes de campos sensíveis, sem distinção de tabela.
 *
 * Consultas com JOIN não sabem de qual tabela veio cada coluna, então a leitura
 * é resolvida pelo nome. É seguro aplicar de forma ampla: `decrypt` devolve o
 * valor intacto quando ele não tem o prefixo de cifra — um `notes` de convênio,
 * por exemplo, passa direto.
 */
const SENSITIVE_FIELD_NAMES = new Set(
  Object.values(ENCRYPTED_FIELDS).flatMap((fields) => [...fields])
);

/** Decifra qualquer campo sensível presente na linha, sem saber a tabela. */
export function decryptByFieldName<T extends Record<string, any>>(row: T): T {
  let touched = false;
  const out: Record<string, any> = { ...row };

  for (const key of Object.keys(out)) {
    if (SENSITIVE_FIELD_NAMES.has(key) && isEncrypted(out[key])) {
      out[key] = decrypt(out[key]);
      touched = true;
    }
  }

  return touched ? (out as T) : row;
}
