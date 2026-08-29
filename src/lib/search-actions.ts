"use server";

import { rawAll } from "./orm";
import { getCurrentUser, patientScope } from "./permissions";

export interface SearchHit {
  id: string;
  fullName: string;
  birthDate: string | null;
  careStage: string | null;
  status: string;
  unidade: string | null;
  responsavel: string | null;
}

/**
 * Busca rápida de pacientes pelo topo do sistema.
 *
 * Procura por nome da criança, CPF e também pelo nome do responsável — na
 * recepção, quem liga costuma se identificar como "mãe do Enzo", e quase nunca
 * se sabe o CPF da criança de cor.
 *
 * O recorte por perfil vale aqui como em todo o resto: profissional só
 * encontra quem ele atende.
 */
export async function searchPatientsAction(term: string): Promise<SearchHit[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const q = term.trim();
  if (q.length < 2) return [];

  const scope = patientScope(user, "p");
  const like = `%${q}%`;

  return rawAll(
    `SELECT p.id, p.fullName, p.birthDate, p.careStage, p.status,
            u.name AS unidade,
            (SELECT r.fullName FROM Responsible r
               JOIN PatientResponsible pr ON pr.responsibleId = r.id
              WHERE pr.patientId = p.id LIMIT 1) AS responsavel
     FROM Patient p
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE ${scope.sql}
       AND (
         p.fullName LIKE ?
         OR p.cpf LIKE ?
         OR p.id IN (
           SELECT pr.patientId FROM PatientResponsible pr
           JOIN Responsible r ON r.id = pr.responsibleId
           WHERE r.fullName LIKE ?
         )
       )
     ORDER BY p.fullName ASC
     LIMIT 8`,
    [...scope.params, like, like, like]
  ) as SearchHit[];
}
