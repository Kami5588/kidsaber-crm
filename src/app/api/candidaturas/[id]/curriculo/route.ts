import { NextResponse } from "next/server";
import { logAccess } from "@/lib/audit";
import { getCurrentUser } from "@/lib/permissions";
import { lerCurriculo } from "@/lib/recrutamento";

/**
 * Entrega o currículo de uma candidatura.
 *
 * O arquivo traz nome, contato e histórico de uma pessoa que não é paciente
 * nem funcionária. Só a administração abre, e cada abertura fica na trilha de
 * auditoria — é dado pessoal de terceiro, e a clínica precisa saber quem viu.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    await logAccess({
      action: "VISUALIZAR",
      entity: "JobApplication",
      entityId: params.id,
      detail: "Tentativa de abrir currículo sem ser administração.",
    });
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const curriculo = lerCurriculo(params.id);
  if (!curriculo) {
    return NextResponse.json({ erro: "Currículo não encontrado." }, { status: 404 });
  }

  await logAccess({
    action: "VISUALIZAR",
    entity: "JobApplication",
    entityId: params.id,
    detail: `Abriu o currículo de ${curriculo.candidateName}.`,
  });

  // Nome ASCII no filename e a versão completa em filename*, como manda a
  // RFC 5987: acento em cabeçalho quebra o download em parte dos navegadores.
  const seguro = curriculo.originalName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  const codificado = encodeURIComponent(curriculo.originalName);

  return new NextResponse(new Uint8Array(curriculo.buffer), {
    headers: {
      "Content-Type": curriculo.mimeType,
      "Content-Disposition": `attachment; filename="${seguro}"; filename*=UTF-8''${codificado}`,
      "Content-Length": String(curriculo.buffer.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
