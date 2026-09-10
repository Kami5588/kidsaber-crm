import fs from "node:fs";
import path from "node:path";
import { rawAll } from "./orm";
import { UPLOAD_DIR, moverParaLixeira } from "./files";

/**
 * Arquivos no volume que nenhum registro do banco aponta mais.
 *
 * Eles aparecem quando a linha some sem que o arquivo saia junto — foi o que
 * a eliminação de dados do titular fazia até esta correção. Cada órfão é dado
 * pessoal guardado sem finalidade e invisível: ninguém o encontra pela tela
 * para apagar.
 *
 * A varredura é conservadora de propósito. Ela decide apagar comparando com o
 * banco, e um engano aqui destrói laudo de criança, então:
 *
 *   - lê as duas colunas que apontam para o volume e para se qualquer consulta
 *     falhar, em vez de tratar "não sei" como "não está em uso";
 *   - ignora arquivo recente, que pode ser upload em andamento cuja linha
 *     ainda não foi gravada;
 *   - manda para a lixeira em vez de apagar, para que um erro de julgamento
 *     ainda tenha volta dentro do prazo.
 */

/** Idade mínima para um arquivo ser candidato a órfão. */
const HORAS_DE_CARENCIA = 24;

/** Colunas que apontam para um arquivo no volume. */
const REFERENCIAS: { tabela: string; coluna: string }[] = [
  { tabela: "Document", coluna: "storedName" },
  { tabela: "JobApplication", coluna: "resumeStoredName" },
];

function nomesEmUso(): Set<string> {
  const vivos = new Set<string>();

  for (const { tabela, coluna } of REFERENCIAS) {
    // Um erro aqui não pode virar "nada está em uso": seria a senha para
    // apagar o volume inteiro. Deixa a exceção subir e a rotina desiste.
    const linhas = rawAll(
      `SELECT ${coluna} AS nome FROM ${tabela} WHERE ${coluna} IS NOT NULL`
    );
    for (const l of linhas) {
      const nome = l.nome as string | null;
      if (nome) vivos.add(nome);
    }
  }

  return vivos;
}

export interface ResultadoVarredura {
  examinados: number;
  recolhidos: number;
  nomes: string[];
}

/** Recolhe para a lixeira os arquivos que nenhum registro aponta. */
export function recolherArquivosOrfaos(): ResultadoVarredura {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return { examinados: 0, recolhidos: 0, nomes: [] };
  }

  const vivos = nomesEmUso();
  const corte = Date.now() - HORAS_DE_CARENCIA * 60 * 60 * 1000;

  const nomes: string[] = [];
  let examinados = 0;

  for (const nome of fs.readdirSync(UPLOAD_DIR)) {
    const caminho = path.join(UPLOAD_DIR, nome);
    if (!fs.statSync(caminho).isFile()) continue;

    examinados++;
    if (vivos.has(nome)) continue;
    if (fs.statSync(caminho).mtimeMs > corte) continue;

    if (moverParaLixeira(nome)) nomes.push(nome);
  }

  return { examinados, recolhidos: nomes.length, nomes };
}
