import { NextResponse } from "next/server";
import { logAccess } from "@/lib/audit";
import { canAccessDocument } from "@/lib/documents";
import { readStoredFile } from "@/lib/files";
import { getCurrentUser } from "@/lib/permissions";
import { rawGet } from "@/lib/orm";

/**
 * Entrega de laudos e documentos.
 *
 * Os arquivos ficam fora de /public justamente para passar por aqui: sem
 * sessão válida e sem vínculo com o paciente, nada é devolvido. Cada download
 * também entra na trilha de auditoria.
 */
export async function GET(
  _request: Request,
  { params }: { params: { storedName: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const doc = rawGet("SELECT * FROM Document WHERE storedName = ?", [params.storedName]);
  if (!doc) {
    return NextResponse.json({ erro: "Documento não encontrado." }, { status: 404 });
  }

  if (!canAccessDocument(user, doc.id)) {
    // Registrar a tentativa importa mais que a resposta: é assim que um acesso
    // indevido a prontuário aparece depois na auditoria.
    await logAccess({
      action: "VISUALIZAR",
      entity: "Document",
      entityId: doc.id,
      detail: "Tentativa de acesso negada: sem vínculo com o paciente.",
    });
    return NextResponse.json({ erro: "Sem permissão para este documento." }, { status: 403 });
  }

  const buffer = readStoredFile(params.storedName);
  if (!buffer) {
    return NextResponse.json({ erro: "Arquivo não encontrado no servidor." }, { status: 404 });
  }

  await logAccess({
    action: "VISUALIZAR",
    entity: "Document",
    entityId: doc.id,
    detail: `Download de "${doc.originalName ?? doc.name}".`,
  });

  const fileName = (doc.originalName ?? doc.name ?? "documento").replace(/"/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      // inline permite ver o PDF no navegador; o nome original é preservado
      // caso a pessoa opte por salvar.
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": String(buffer.length),
      // Prontuário não deve ficar em cache de proxy nenhum.
      "Cache-Control": "private, no-store",
    },
  });
}
