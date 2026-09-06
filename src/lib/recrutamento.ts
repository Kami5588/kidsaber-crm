import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { insertRow, rawAll, rawGet } from "./orm";
import { UPLOAD_DIR, deleteStoredFile } from "./files";

/**
 * Recrutamento: vagas divulgadas no site e currículos recebidos.
 *
 * O formulário é público, então tudo aqui parte de que a entrada é hostil: o
 * tipo do arquivo é conferido pelo conteúdo, não pela extensão; o tamanho é
 * cortado antes de chegar ao disco; e há teto de envios, senão o volume da
 * clínica vira depósito de quem quiser enchê-lo.
 *
 * O currículo é gravado como arquivo no volume, nunca dentro do banco. Um PDF
 * dentro do SQLite entraria em todas as cópias diárias de segurança, e catorze
 * cópias de cada currículo já enviado estouram o disco em poucas semanas.
 */

export { MAX_CURRICULO_BYTES, ACCEPT_CURRICULO, MESES_GUARDA_CURRICULO } from "./recrutamento-constants";
import { MAX_CURRICULO_BYTES, MESES_GUARDA_CURRICULO } from "./recrutamento-constants";

/**
 * Tipos aceitos e a assinatura que o arquivo precisa ter de verdade.
 *
 * O `type` que o navegador manda é escolhido por quem envia e não prova nada.
 * Conferir os primeiros bytes evita guardar um executável renomeado para .pdf.
 */
const TIPOS: Record<string, { ext: string; assinatura: Buffer[] }> = {
  "application/pdf": {
    ext: ".pdf",
    assinatura: [Buffer.from("%PDF-")],
  },
  "application/msword": {
    ext: ".doc",
    // Documento OLE2 do Word 97-2003.
    assinatura: [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: ".docx",
    // .docx é um zip: "PK\x03\x04".
    assinatura: [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
  },
};

/** Quantas candidaturas o mesmo e-mail pode mandar por dia. */
const MAX_POR_EMAIL_DIA = 3;

/** Teto por origem na hora, para que um robô não encha o disco. */
const MAX_POR_IP_HORA = 10;

/** Prefixo dos contadores de candidatura na tabela de tentativas. */
const PREFIXO_CANDIDATURA = "cand:";


export interface VagaPublica {
  id: string;
  title: string;
  description: string;
  specialties: string | null;
  unitIds: string | null;
}

/** Vagas que o site deve mostrar: abertas e dentro do prazo. */
export function vagasAbertas(): VagaPublica[] {
  return rawAll(
    `SELECT id, title, description, specialties, unitIds
     FROM JobOpening
     WHERE status = 'Aberta'
       AND (expiresAt IS NULL OR expiresAt >= date('now'))
     ORDER BY createdAt DESC`
  ) as unknown as VagaPublica[];
}

function contar(identificador: string, desde: string): number {
  return (rawGet(
    `SELECT COUNT(*) as c FROM LoginAttempt
     WHERE identifier = ? AND createdAt >= ?`,
    [identificador, desde]
  )?.c ?? 0) as number;
}

function registrarEnvio(identificador: string): void {
  insertRow("LoginAttempt", { identifier: identificador, success: 1 });
}

/** Erro de entrada: a mensagem pode ser mostrada a quem enviou. */
export class ErroCandidatura extends Error {}

/**
 * Confere os tetos de envio antes de aceitar mais um currículo.
 *
 * Reusa a tabela de tentativas de login porque ela já existe, já é limpa pela
 * rotina diária e já sobrevive a reinício do container.
 */
export function checarLimite(email: string, ip?: string | null): void {
  const umDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const umaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const porEmail = contar(PREFIXO_CANDIDATURA + email.trim().toLowerCase(), umDia);
  if (porEmail >= MAX_POR_EMAIL_DIA) {
    throw new ErroCandidatura(
      "Já recebemos seu currículo hoje. Se precisar corrigir algo, fale com a clínica."
    );
  }

  if (ip) {
    const porOrigem = contar(PREFIXO_CANDIDATURA + "ip:" + ip, umaHora);
    if (porOrigem >= MAX_POR_IP_HORA) {
      throw new ErroCandidatura("Muitos envios agora há pouco. Tente novamente em uma hora.");
    }
  }
}

/**
 * Grava o currículo no volume depois de conferir tipo, tamanho e assinatura.
 *
 * O nome no disco é aleatório: guardar o nome enviado permitiria adivinhar
 * caminhos, e um nome com "../" tentaria escapar do diretório.
 */
async function gravarCurriculo(arquivo: File) {
  if (!arquivo || arquivo.size === 0) {
    throw new ErroCandidatura("Anexe o currículo.");
  }
  if (arquivo.size > MAX_CURRICULO_BYTES) {
    throw new ErroCandidatura("O currículo precisa ter no máximo 5 MB.");
  }

  const tipo = TIPOS[arquivo.type];
  if (!tipo) {
    throw new ErroCandidatura("Envie o currículo em PDF, DOC ou DOCX.");
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const confere = tipo.assinatura.some((a) => buffer.subarray(0, a.length).equals(a));
  if (!confere) {
    throw new ErroCandidatura("O arquivo não parece ser um documento válido.");
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const storedName = `${crypto.randomUUID()}${tipo.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buffer);

  return {
    storedName,
    originalName: arquivo.name.slice(0, 180),
    mimeType: arquivo.type,
    sizeBytes: arquivo.size,
  };
}

export interface DadosCandidatura {
  nome: string;
  email: string;
  telefone: string;
  unidades: string[];
  vagaId?: string | null;
  curriculo: File;
  ip?: string | null;
}

/** Registra a candidatura por inteiro: valida, grava o arquivo e insere a linha. */
export async function registrarCandidatura(d: DadosCandidatura): Promise<void> {
  const nome = d.nome?.trim();
  const email = d.email?.trim().toLowerCase();
  const telefone = d.telefone?.trim();

  if (!nome || nome.length < 3) throw new ErroCandidatura("Informe seu nome completo.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErroCandidatura("Informe um e-mail válido.");
  }
  if (!telefone || telefone.replace(/\D/g, "").length < 10) {
    throw new ErroCandidatura("Informe um telefone com DDD.");
  }
  if (d.unidades.length === 0) {
    throw new ErroCandidatura("Escolha ao menos uma unidade de interesse.");
  }

  // A vaga precisa existir e estar aberta: um id inventado no formulário não
  // pode virar candidatura apontando para lugar nenhum.
  let vagaId: string | null = null;
  if (d.vagaId) {
    const vaga = rawGet(
      `SELECT id FROM JobOpening WHERE id = ? AND status = 'Aberta'
        AND (expiresAt IS NULL OR expiresAt >= date('now'))`,
      [d.vagaId]
    );
    if (!vaga) throw new ErroCandidatura("Esta vaga não está mais aberta.");
    vagaId = d.vagaId;
  }

  checarLimite(email, d.ip);

  const arquivo = await gravarCurriculo(d.curriculo);

  try {
    insertRow("JobApplication", {
      jobId: vagaId,
      candidateName: nome.slice(0, 180),
      candidateEmail: email.slice(0, 180),
      candidatePhone: telefone.slice(0, 40),
      interestedUnits: d.unidades.join(", ").slice(0, 200),
      resumeStoredName: arquivo.storedName,
      resumeOriginalName: arquivo.originalName,
      resumeMimeType: arquivo.mimeType,
      resumeSizeBytes: arquivo.sizeBytes,
      status: "Novo",
    });
  } catch (err) {
    // Sem a linha no banco o arquivo vira lixo invisível no volume.
    deleteStoredFile(arquivo.storedName);
    throw err;
  }

  registrarEnvio(PREFIXO_CANDIDATURA + email);
  if (d.ip) registrarEnvio(PREFIXO_CANDIDATURA + "ip:" + d.ip);
}

/**
 * Descarta currículos vencidos.
 *
 * Apaga o arquivo do volume e limpa os campos na linha, mas guarda a
 * candidatura em si: a clínica continua sabendo que a pessoa se candidatou e
 * quando, sem manter o documento pessoal além do prazo.
 */
export function descartarCurriculosVencidos(): number {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESES_GUARDA_CURRICULO);

  const vencidas = rawAll(
    `SELECT id, resumeStoredName FROM JobApplication
     WHERE resumeStoredName IS NOT NULL AND createdAt < ?`,
    [limite.toISOString()]
  );

  for (const linha of vencidas) {
    deleteStoredFile(linha.resumeStoredName as string);
    rawAll(
      `UPDATE JobApplication
       SET resumeStoredName = NULL, resumeOriginalName = NULL,
           resumeMimeType = NULL, resumeSizeBytes = NULL,
           notes = COALESCE(notes || ' | ', '') || 'Currículo descartado pelo prazo de guarda.'
       WHERE id = ?`,
      [linha.id as string]
    );
  }

  return vencidas.length;
}

/** Lê o currículo de uma candidatura, para entrega pela rota autenticada. */
export function lerCurriculo(candidaturaId: string) {
  const linha = rawGet(
    `SELECT resumeStoredName, resumeOriginalName, resumeMimeType, candidateName
     FROM JobApplication WHERE id = ?`,
    [candidaturaId]
  );
  if (!linha?.resumeStoredName) return null;

  // A leitura reusa a validação de caminho de files.ts.
  const { readStoredFile } = require("./files") as typeof import("./files");
  const buffer = readStoredFile(linha.resumeStoredName as string);
  if (!buffer) return null;

  return {
    buffer,
    originalName: (linha.resumeOriginalName as string) ?? "curriculo",
    mimeType: (linha.resumeMimeType as string) ?? "application/octet-stream",
    candidateName: linha.candidateName as string,
  };
}
