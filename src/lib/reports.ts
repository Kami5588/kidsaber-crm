import { rawAll, rawGet } from "./orm";

/**
 * Relatório gerencial mensal.
 *
 * Responde às perguntas que a direção faz no fechamento do mês: quanto entrou,
 * quantos atendimentos aconteceram, quantas crianças chegaram e como cada
 * unidade se comportou.
 */

export interface MonthTotals {
  atendimentosRealizados: number;
  atendimentosCancelados: number;
  atendimentosAgendados: number;
  comparecimento: number | null;
  pacientesAtivos: number;
  novosPacientes: number;
  receitaRecebida: number;
  receitaPendente: number;
  receitaAtrasada: number;
  leadsRecebidos: number;
  leadsConvertidos: number;
}

/** Limites do mês no formato AAAA-MM, em horário local. */
function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Recorte de unidade, quando uma específica está selecionada. */
function unitClause(alias: string, unitId?: string | null) {
  if (!unitId) return { sql: "1=1", params: [] as string[] };
  return { sql: `(${alias}.unitId = ? OR ${alias}.unitId IS NULL)`, params: [unitId] };
}

export function monthTotals(month: string, unitId?: string | null): MonthTotals {
  const { start, end } = monthRange(month);

  const s = unitClause("s", unitId);
  const p = unitClause("p", unitId);
  const i = unitClause("i", unitId);
  const l = unitClause("l", unitId);

  const count = (sql: string, params: any[]) => (rawGet(sql, params)?.c ?? 0) as number;
  const sum = (sql: string, params: any[]) => (rawGet(sql, params)?.s ?? 0) as number;

  const realizados = count(
    `SELECT COUNT(*) c FROM Session s WHERE s.sessionDate >= ? AND s.sessionDate < ?
      AND s.status IN ('Realizada','Relatório pendente') AND ${s.sql}`,
    [start, end, ...s.params]
  );
  const cancelados = count(
    `SELECT COUNT(*) c FROM Session s WHERE s.sessionDate >= ? AND s.sessionDate < ?
      AND s.status = 'Cancelada' AND ${s.sql}`,
    [start, end, ...s.params]
  );
  const agendados = count(
    `SELECT COUNT(*) c FROM Session s WHERE s.sessionDate >= ? AND s.sessionDate < ?
      AND s.status = 'Agendada' AND ${s.sql}`,
    [start, end, ...s.params]
  );

  const encerrados = realizados + cancelados;

  return {
    atendimentosRealizados: realizados,
    atendimentosCancelados: cancelados,
    atendimentosAgendados: agendados,
    comparecimento: encerrados > 0 ? Math.round((realizados / encerrados) * 100) : null,

    pacientesAtivos: count(
      `SELECT COUNT(*) c FROM Patient p WHERE p.status = 'Ativo' AND ${p.sql}`,
      p.params
    ),
    novosPacientes: count(
      `SELECT COUNT(*) c FROM Patient p WHERE p.createdAt >= ? AND p.createdAt < ? AND ${p.sql}`,
      [start, end, ...p.params]
    ),

    receitaRecebida: sum(
      `SELECT COALESCE(SUM(i.amount - i.discount),0) s FROM Invoice i
        WHERE i.referenceMonth = ? AND i.status = 'Pago' AND ${i.sql}`,
      [month, ...i.params]
    ),
    receitaPendente: sum(
      `SELECT COALESCE(SUM(i.amount - i.discount),0) s FROM Invoice i
        WHERE i.referenceMonth = ? AND i.status = 'Pendente' AND ${i.sql}`,
      [month, ...i.params]
    ),
    receitaAtrasada: sum(
      `SELECT COALESCE(SUM(i.amount - i.discount),0) s FROM Invoice i
        WHERE i.referenceMonth = ? AND i.status = 'Atrasado' AND ${i.sql}`,
      [month, ...i.params]
    ),

    leadsRecebidos: count(
      `SELECT COUNT(*) c FROM Lead l WHERE l.createdAt >= ? AND l.createdAt < ? AND ${l.sql}`,
      [start, end, ...l.params]
    ),
    leadsConvertidos: count(
      `SELECT COUNT(*) c FROM Lead l WHERE l.createdAt >= ? AND l.createdAt < ?
        AND l.status = 'Convertido' AND ${l.sql}`,
      [start, end, ...l.params]
    ),
  };
}

/** Desempenho de cada unidade no mês, lado a lado. */
export function byUnit(month: string) {
  const { start, end } = monthRange(month);

  return rawAll(
    `SELECT u.id, u.name, u.city, u.state, u.isMain,
      (SELECT COUNT(*) FROM Patient p WHERE p.unitId = u.id AND p.status = 'Ativo') AS pacientesAtivos,
      (SELECT COUNT(*) FROM Session s WHERE s.unitId = u.id AND s.sessionDate >= ? AND s.sessionDate < ?
         AND s.status IN ('Realizada','Relatório pendente')) AS atendimentos,
      (SELECT COUNT(*) FROM Session s WHERE s.unitId = u.id AND s.sessionDate >= ? AND s.sessionDate < ?
         AND s.status = 'Cancelada') AS cancelados,
      (SELECT COALESCE(SUM(i.amount - i.discount),0) FROM Invoice i
         WHERE i.unitId = u.id AND i.referenceMonth = ? AND i.status = 'Pago') AS receita
     FROM Unit u WHERE u.status = 'Ativo'
     ORDER BY u.isMain DESC, u.name ASC`,
    [start, end, start, end, month]
  );
}

/** Atendimentos por especialidade, para ver onde está a demanda. */
export function bySpecialty(month: string, unitId?: string | null) {
  const { start, end } = monthRange(month);
  const s = unitClause("s", unitId);

  return rawAll(
    `SELECT s.specialty, COUNT(*) AS atendimentos
     FROM Session s
     WHERE s.sessionDate >= ? AND s.sessionDate < ?
       AND s.status IN ('Realizada','Relatório pendente') AND ${s.sql}
     GROUP BY s.specialty
     ORDER BY atendimentos DESC`,
    [start, end, ...s.params]
  );
}

/** Origem dos contatos recebidos, para saber o que traz paciente. */
export function byLeadOrigin(month: string, unitId?: string | null) {
  const { start, end } = monthRange(month);
  const l = unitClause("l", unitId);

  return rawAll(
    `SELECT COALESCE(l.origin, 'Não informado') AS origem, COUNT(*) AS total
     FROM Lead l
     WHERE l.createdAt >= ? AND l.createdAt < ? AND ${l.sql}
     GROUP BY COALESCE(l.origin, 'Não informado')
     ORDER BY total DESC`,
    [start, end, ...l.params]
  );
}

/** Meses que já têm algum movimento, para preencher o seletor. */
export function availableMonths(): string[] {
  const rows = rawAll(
    `SELECT DISTINCT substr(sessionDate, 1, 7) AS mes FROM Session
     UNION SELECT DISTINCT referenceMonth FROM Invoice WHERE referenceMonth IS NOT NULL
     ORDER BY mes DESC`
  );

  const meses = rows.map((r) => r.mes as string).filter(Boolean);
  const atual = new Date().toISOString().slice(0, 7);
  if (!meses.includes(atual)) meses.unshift(atual);

  return meses.slice(0, 24);
}

/**
 * Monta o CSV do relatório.
 *
 * Usa ponto e vírgula e vírgula decimal: é o que o Excel em português abre em
 * colunas sem pedir importação manual. O BOM no início evita que os acentos
 * apareçam trocados.
 */
export function buildCsv(month: string, unitId?: string | null): string {
  const t = monthTotals(month, unitId);
  const unidades = byUnit(month);
  const especialidades = bySpecialty(month, unitId);
  const origens = byLeadOrigin(month, unitId);

  const brl = (n: number) => n.toFixed(2).replace(".", ",");
  const linhas: string[] = [];

  linhas.push(`Relatório mensal - Clínica KidSaber`);
  linhas.push(`Competência;${month}`);
  linhas.push(`Gerado em;${new Date().toLocaleString("pt-BR")}`);
  linhas.push("");

  linhas.push("RESUMO DO MÊS");
  linhas.push("Indicador;Valor");
  linhas.push(`Atendimentos realizados;${t.atendimentosRealizados}`);
  linhas.push(`Atendimentos cancelados;${t.atendimentosCancelados}`);
  linhas.push(`Atendimentos agendados;${t.atendimentosAgendados}`);
  linhas.push(`Taxa de comparecimento;${t.comparecimento === null ? "-" : t.comparecimento + "%"}`);
  linhas.push(`Pacientes ativos;${t.pacientesAtivos}`);
  linhas.push(`Novos pacientes no mês;${t.novosPacientes}`);
  linhas.push(`Receita recebida;${brl(t.receitaRecebida)}`);
  linhas.push(`Receita pendente;${brl(t.receitaPendente)}`);
  linhas.push(`Receita atrasada;${brl(t.receitaAtrasada)}`);
  linhas.push(`Contatos recebidos;${t.leadsRecebidos}`);
  linhas.push(`Contatos convertidos;${t.leadsConvertidos}`);
  linhas.push("");

  linhas.push("POR UNIDADE");
  linhas.push("Unidade;Cidade;Pacientes ativos;Atendimentos;Cancelados;Receita recebida");
  for (const u of unidades) {
    linhas.push(
      [u.name, `${u.city}/${u.state}`, u.pacientesAtivos, u.atendimentos, u.cancelados, brl(Number(u.receita ?? 0))].join(";")
    );
  }
  linhas.push("");

  linhas.push("POR ESPECIALIDADE");
  linhas.push("Especialidade;Atendimentos");
  for (const e of especialidades) linhas.push(`${e.specialty};${e.atendimentos}`);
  linhas.push("");

  linhas.push("ORIGEM DOS CONTATOS");
  linhas.push("Origem;Total");
  for (const o of origens) linhas.push(`${o.origem};${o.total}`);

  return "﻿" + linhas.join("\r\n");
}
