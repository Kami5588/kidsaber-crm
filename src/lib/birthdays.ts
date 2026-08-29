import { rawAll } from "./orm";
import { patientScope, type CurrentUser } from "./permissions";

/**
 * Aniversariantes do mês.
 *
 * Numa clínica infantil, lembrar do aniversário é relacionamento barato e de
 * efeito real: a família percebe que a criança é acompanhada por gente, não
 * por um cadastro.
 */

export interface Birthday {
  id: string;
  fullName: string;
  birthDate: string;
  dia: number;
  idadeQueFaz: number;
  unidade: string | null;
  responsavel: string | null;
  telefone: string | null;
  status: string;
  ehHoje: boolean;
}

export function monthBirthdays(user: CurrentUser | null, month?: number): Birthday[] {
  if (!user) return [];

  const hoje = new Date();
  const mes = month ?? hoje.getMonth() + 1;
  const mm = String(mes).padStart(2, "0");

  const scope = patientScope(user, "p");

  // A data de nascimento é guardada como texto AAAA-MM-DD, então o mês sai
  // com substr — comparar como data traria o ano junto.
  const rows = rawAll(
    `SELECT p.id, p.fullName, p.birthDate, p.status,
            u.name AS unidade,
            (SELECT r.fullName FROM Responsible r
               JOIN PatientResponsible pr ON pr.responsibleId = r.id
              WHERE pr.patientId = p.id LIMIT 1) AS responsavel,
            (SELECT r.phone FROM Responsible r
               JOIN PatientResponsible pr ON pr.responsibleId = r.id
              WHERE pr.patientId = p.id LIMIT 1) AS telefone
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE p.birthDate IS NOT NULL
       AND substr(p.birthDate, 6, 2) = ?
       AND p.status != 'Inativo'
       AND ${scope.sql}`,
    [mm, ...scope.params]
  );

  return rows
    .map((r) => {
      const nascimento = String(r.birthDate);
      const dia = Number(nascimento.slice(8, 10));
      const anoNascimento = Number(nascimento.slice(0, 4));

      return {
        id: r.id as string,
        fullName: r.fullName as string,
        birthDate: nascimento,
        dia,
        idadeQueFaz: hoje.getFullYear() - anoNascimento,
        unidade: (r.unidade as string) ?? null,
        responsavel: (r.responsavel as string) ?? null,
        telefone: (r.telefone as string) ?? null,
        status: r.status as string,
        ehHoje: dia === hoje.getDate() && mes === hoje.getMonth() + 1,
      };
    })
    .sort((a, b) => a.dia - b.dia);
}
