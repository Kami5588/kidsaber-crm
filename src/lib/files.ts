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

/**
 * Formato do nome gerado por saveUploadedFile: UUID mais extensão.
 *
 * Todo nome vindo de fora passa por aqui antes de virar caminho — é o que
 * impede que um valor como "../../etc/senha" saia do diretório.
 */
const NOME_ARMAZENADO = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i;

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
  if (!NOME_ARMAZENADO.test(storedName)) return null;

  const full = path.join(UPLOAD_DIR, storedName);
  if (!full.startsWith(UPLOAD_DIR)) return null;
  if (!fs.existsSync(full)) return null;

  return fs.readFileSync(full);
}

/**
 * Apaga o arquivo de vez, sem passar pela lixeira.
 *
 * Reservado para quando a remoção é o objetivo — pedido de eliminação do
 * titular, descarte por prazo de guarda, limpeza de upload que não chegou a
 * virar registro. Para exclusão feita por uma pessoa na tela, use
 * `moverParaLixeira`: ali o apagar sem querer é o caso provável.
 */
export function deleteStoredFile(storedName?: string | null): void {
  if (!storedName) return;
  if (!NOME_ARMAZENADO.test(storedName)) return;

  const full = path.join(UPLOAD_DIR, storedName);
  if (full.startsWith(UPLOAD_DIR) && fs.existsSync(full)) fs.unlinkSync(full);
}

/**
 * Lixeira dos arquivos excluídos na tela.
 *
 * A cópia diária de segurança leva o banco, não o volume: um laudo apagado por
 * engano não voltaria por ela. Como o arquivo é imutável e tem nome único,
 * movê-lo para cá custa zero espaço a mais e devolve à clínica a chance de
 * desfazer — que é o que a tela de cópias promete.
 *
 * O prazo existe para que a lixeira não vire um arquivo morto permanente de
 * dado sensível: passado ele, o arquivo é apagado de vez pela rotina diária.
 */
export const LIXEIRA_DIR = path.join(dataDir, "lixeira");

export const DIAS_NA_LIXEIRA = 30;

/** A data de exclusão vai no nome: o prazo não pode depender do mtime, que
 *  cópia e restauração de volume costumam reescrever. */
const NOME_NA_LIXEIRA = /^(\d{4}-\d{2}-\d{2})__([0-9a-f-]{36}\.[a-z0-9]{2,5})$/i;

/**
 * Tira o arquivo de circulação sem destruí-lo. Devolve o nome na lixeira, que
 * vale a pena registrar na auditoria: é por ele que o arquivo é reencontrado.
 */
export function moverParaLixeira(storedName?: string | null): string | null {
  if (!storedName) return null;
  if (!NOME_ARMAZENADO.test(storedName)) return null;

  const origem = path.join(UPLOAD_DIR, storedName);
  if (!origem.startsWith(UPLOAD_DIR) || !fs.existsSync(origem)) return null;

  if (!fs.existsSync(LIXEIRA_DIR)) fs.mkdirSync(LIXEIRA_DIR, { recursive: true });

  const nomeNaLixeira = `${new Date().toISOString().slice(0, 10)}__${storedName}`;
  const destino = path.join(LIXEIRA_DIR, nomeNaLixeira);

  try {
    fs.renameSync(origem, destino);
  } catch {
    // Volume montado de outra forma pode recusar rename; copiar e apagar tem
    // o mesmo efeito e mantém a garantia de que o arquivo não se perde.
    fs.copyFileSync(origem, destino);
    fs.unlinkSync(origem);
  }
  return nomeNaLixeira;
}

/** Devolve um arquivo da lixeira ao uso. */
export function restaurarDaLixeira(nomeNaLixeira: string): string | null {
  const casa = NOME_NA_LIXEIRA.exec(nomeNaLixeira);
  if (!casa) return null;

  const origem = path.join(LIXEIRA_DIR, nomeNaLixeira);
  if (!origem.startsWith(LIXEIRA_DIR) || !fs.existsSync(origem)) return null;

  const storedName = casa[2]!;
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.renameSync(origem, path.join(UPLOAD_DIR, storedName));
  return storedName;
}

/** Apaga de vez o que passou do prazo. Devolve quantos arquivos saíram. */
export function esvaziarLixeiraVencida(dias = DIAS_NA_LIXEIRA): number {
  if (!fs.existsSync(LIXEIRA_DIR)) return 0;

  const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let apagados = 0;
  for (const nome of fs.readdirSync(LIXEIRA_DIR)) {
    const casa = NOME_NA_LIXEIRA.exec(nome);
    if (!casa) continue; // nome fora do padrão fica: melhor sobrar que apagar errado
    if (casa[1]! >= limite) continue;

    fs.unlinkSync(path.join(LIXEIRA_DIR, nome));
    apagados++;
  }
  return apagados;
}

/** Quanto a lixeira ocupa, para a tela de cópias mostrar. */
export function estadoLixeira(): { arquivos: number; bytes: number } {
  if (!fs.existsSync(LIXEIRA_DIR)) return { arquivos: 0, bytes: 0 };

  let arquivos = 0;
  let bytes = 0;
  for (const nome of fs.readdirSync(LIXEIRA_DIR)) {
    if (!NOME_NA_LIXEIRA.test(nome)) continue;
    arquivos++;
    bytes += fs.statSync(path.join(LIXEIRA_DIR, nome)).size;
  }
  return { arquivos, bytes };
}
