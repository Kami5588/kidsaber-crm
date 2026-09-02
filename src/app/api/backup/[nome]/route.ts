import { NextResponse } from "next/server";
import { logAccess } from "@/lib/audit";
import { lerCopia, tamanhoLegivel } from "@/lib/backup";
import { getCurrentUser } from "@/lib/permissions";

/**
 * Download de uma cópia de segurança.
 *
 * O arquivo é o banco inteiro: todos os pacientes de todas as unidades. Só a
 * administração pode baixar, e cada download entra na trilha de auditoria —
 * levar a base da clínica embora tem de deixar rastro.
 */
export async function GET(
  _request: Request,
  { params }: { params: { nome: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    await logAccess({
      action: "EXPORTAR_DADOS",
      entity: "Backup",
      detail: `Tentativa de baixar a cópia "${params.nome}" sem ser administração.`,
    });
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const buffer = lerCopia(params.nome);
  if (!buffer) {
    return NextResponse.json({ erro: "Cópia não encontrada." }, { status: 404 });
  }

  await logAccess({
    action: "EXPORTAR_DADOS",
    entity: "Backup",
    detail: `Download da cópia de segurança "${params.nome}" (${tamanhoLegivel(buffer.length)}).`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      // Tipo genérico e anexo: o navegador não deve tentar abrir um banco.
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${params.nome}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
