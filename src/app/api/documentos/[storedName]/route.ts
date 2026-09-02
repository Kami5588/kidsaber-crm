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
/**
 * Tipos que o navegador pode abrir na própria janela.
 *
 * O resto desce como anexo. O mimeType guardado veio do navegador de quem
 * enviou, e não do conteúdo do arquivo: abrir na janela um tipo que não está
 * nesta lista é dar ao arquivo a chance de rodar no endereço do sistema.
 */
const VISUALIZAVEIS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Nome de arquivo em cabeçalho, conforme a RFC 5987. */
function contentDisposition(modo: "inline" | "attachment", nome: string): string {
  // A versão sem acentos serve aos navegadores antigos; a versão codificada,
  // aos atuais. Aspas e barras invertidas sairiam do campo entre aspas.
  const simples = nome.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return `${modo}; filename="${simples}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

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

  const fileName = doc.originalName ?? doc.name ?? "documento";
  const mimeType = doc.mimeType ?? "application/octet-stream";
  const modo = VISUALIZAVEIS.has(mimeType) ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      // O PDF e as imagens abrem na janela; o resto vai como anexo.
      "Content-Disposition": contentDisposition(modo, fileName),
      "Content-Length": String(buffer.length),
      // Prontuário não deve ficar em cache de proxy nenhum.
      "Cache-Control": "private, no-store",
      // O arquivo é de terceiro: mesmo servido pelo sistema, não deve herdar a
      // origem dele nem executar script, e o navegador não pode adivinhar o
      // tipo a partir do conteúdo.
      "Content-Security-Policy": "default-src 'none'; sandbox; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
