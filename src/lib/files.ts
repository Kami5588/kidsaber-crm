import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Armazenamento dos laudos e documentos enviados.
 *
 * Os arquivos vão para o volume persistente, **fora de /public**: laudo de
 * criança não pode ficar num endereço público que qualquer pessoa com o link
 * abre. A entrega passa por uma rota autenticada, que confere permissão antes
 * de devolver o conteúdo.
 */

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(dataDir, "uploads");

import { MAX_FILE_BYTES, ACCEPT_ATTRIBUTE, humanSize } from "./file-constants";

export { MAX_FILE_BYTES, ACCEPT_ATTRIBUTE, humanSize };

/** Tipos aceitos, com a extensão que será usada no arquivo salvo. */
const ALLOWED: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
};

export function isAllowedType(mimeType: string): boolean {
  return mimeType in ALLOWED;
}

export interface StoredFile {
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Grava o arquivo enviado e devolve os metadados.
 *
 * O nome no disco é aleatório: preservar o nome original permitiria adivinhar
 * caminhos e, pior, um nome malicioso poderia escapar do diretório.
 */
export async function saveUploadedFile(file: File): Promise<StoredFile> {
  if (!file || file.size === 0) throw new Error("Selecione um arquivo.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Arquivo muito grande. O limite é ${humanSize(MAX_FILE_BYTES)}.`);
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedType(mimeType)) {
    throw new Error(
      "Formato não aceito. Envie PDF, imagem (JPG, PNG, WEBP), Word, Excel ou texto."
    );
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const storedName = `${crypto.randomUUID()}${ALLOWED[mimeType]}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buffer);

  return {
    storedName,
    originalName: file.name.slice(0, 180),
    mimeType,
    sizeBytes: file.size,
  };
}

/**
 * Lê um arquivo do armazenamento.
 *
 * O nome é validado contra um formato fixo antes de virar caminho, para que
 * um valor como "../../etc/senha" não consiga sair do diretório de uploads.
 */
export function readStoredFile(storedName: string): Buffer | null {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(storedName)) return null;

  const full = path.join(UPLOAD_DIR, storedName);
  if (!full.startsWith(UPLOAD_DIR)) return null;
  if (!fs.existsSync(full)) return null;

  return fs.readFileSync(full);
}

export function deleteStoredFile(storedName?: string | null): void {
  if (!storedName) return;
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(storedName)) return;

  const full = path.join(UPLOAD_DIR, storedName);
  if (full.startsWith(UPLOAD_DIR) && fs.existsSync(full)) fs.unlinkSync(full);
}
