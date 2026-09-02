import fs from "node:fs";
import path from "node:path";
import { db } from "./db";

/**
 * Rotina de backup do banco.
 *
 * A política de privacidade promete ao titular que os dados ficam "em ambiente
 * com rotina de backup". Até aqui essa frase não correspondia a nada: havia um
 * único arquivo SQLite no volume, e uma exclusão errada ou uma corrupção não
 * teriam volta.
 *
 * O que esta rotina protege e o que não protege:
 *
 *   protege  — exclusão acidental de registros, corrupção do arquivo, um deploy
 *              que estrague os dados, voltar ao estado de ontem
 *   NÃO protege — perda do volume inteiro, já que as cópias moram nele. Para
 *              isso é preciso baixar uma cópia de tempos em tempos e guardá-la
 *              fora do Railway; a tela de administração existe para isso.
 */

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const BACKUP_DIR = path.join(dataDir, "backups");

/** Cópias diárias mantidas. Duas semanas cobrem um erro percebido tarde. */
export const MANTER_COPIAS = 14;

const NOME = /^kidsaber-(\d{4}-\d{2}-\d{2})\.db$/;

export interface Copia {
  nome: string;
  data: string;
  bytes: number;
  criadaEm: string;
}

function garantirDiretorio() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/** Data de hoje em AAAA-MM-DD, no fuso local. */
function hoje(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function listarCopias(): Copia[] {
  garantirDiretorio();

  return fs
    .readdirSync(BACKUP_DIR)
    .map((nome) => {
      const m = NOME.exec(nome);
      if (!m) return null;
      const info = fs.statSync(path.join(BACKUP_DIR, nome));
      return { nome, data: m[1], bytes: info.size, criadaEm: info.mtime.toISOString() };
    })
    .filter((c): c is Copia => c !== null)
    .sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Gera a cópia do dia, se ainda não existir.
 *
 * Usa `VACUUM INTO`, que é a forma correta de copiar um SQLite em uso: ele
 * grava um arquivo íntegro mesmo com escritas acontecendo. Copiar o arquivo com
 * `fs.copyFile` produziria uma cópia possivelmente quebrada, porque parte das
 * transações vive no arquivo -wal.
 */
export function gerarCopiaDoDia(): { criada: boolean; nome: string; motivo?: string } {
  garantirDiretorio();

  const nome = `kidsaber-${hoje()}.db`;
  const destino = path.join(BACKUP_DIR, nome);

  if (fs.existsSync(destino)) return { criada: false, nome, motivo: "A cópia de hoje já existe." };

  // VACUUM INTO recusa escrever por cima de um arquivo existente, então
  // qualquer sobra de uma tentativa interrompida precisa sair antes.
  const parcial = `${destino}.parcial`;
  if (fs.existsSync(parcial)) fs.unlinkSync(parcial);

  db.exec(`VACUUM INTO '${parcial.replace(/'/g, "''")}'`);
  fs.renameSync(parcial, destino);

  descartarAntigas();
  return { criada: true, nome };
}

/** Mantém apenas as cópias mais recentes. */
export function descartarAntigas(manter = MANTER_COPIAS): string[] {
  const copias = listarCopias();
  const sobrando = copias.slice(manter);

  for (const c of sobrando) {
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, c.nome));
    } catch {
      // Uma cópia que não pôde ser apagada não justifica derrubar a rotina.
    }
  }

  return sobrando.map((c) => c.nome);
}

/**
 * Lê uma cópia para download.
 *
 * O nome é conferido contra o formato fixo antes de virar caminho: sem isso um
 * valor como "../kidsaber.db" sairia do diretório de cópias.
 */
export function lerCopia(nome: string): Buffer | null {
  if (!NOME.test(nome)) return null;

  const caminho = path.join(BACKUP_DIR, nome);
  if (!caminho.startsWith(BACKUP_DIR)) return null;
  if (!fs.existsSync(caminho)) return null;

  return fs.readFileSync(caminho);
}

export interface EstadoBackup {
  copias: Copia[];
  ultima: Copia | null;
  /** Horas desde a última cópia; null quando ainda não há nenhuma. */
  horasDesdeUltima: number | null;
  totalBytes: number;
}

export function estadoBackup(): EstadoBackup {
  const copias = listarCopias();
  const ultima = copias[0] ?? null;

  return {
    copias,
    ultima,
    horasDesdeUltima: ultima
      ? Math.floor((Date.now() - new Date(ultima.criadaEm).getTime()) / 3600000)
      : null,
    totalBytes: copias.reduce((s, c) => s + c.bytes, 0),
  };
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
