import { NextResponse } from "next/server";
import { logAccess } from "@/lib/audit";
import { getCurrentUser } from "@/lib/permissions";
import { insertRow } from "@/lib/orm";

/**
 * Cadastro de vaga.
 *
 * O que entra aqui vai direto para a página pública, então o texto é limitado
 * em tamanho e o prazo é conferido: uma data mal digitada tiraria a vaga do ar
 * no mesmo dia, ou a deixaria para sempre.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  let corpo: any;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const title = String(corpo.title ?? "").trim();
  const description = String(corpo.description ?? "").trim();
  const expiresAt = corpo.expiresAt ? String(corpo.expiresAt).trim() : null;

  if (title.length < 5) {
    return NextResponse.json(
      { erro: "O título precisa dizer qual é a vaga." },
      { status: 400 }
    );
  }
  if (description.length < 20) {
    return NextResponse.json(
      { erro: "Descreva a vaga com um pouco mais de detalhe." },
      { status: 400 }
    );
  }
  if (expiresAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
      return NextResponse.json({ erro: "Data de encerramento inválida." }, { status: 400 });
    }
    if (expiresAt < new Date().toISOString().slice(0, 10)) {
      return NextResponse.json(
        { erro: "A data de encerramento já passou: a vaga nasceria fora do ar." },
        { status: 400 }
      );
    }
  }

  try {
    insertRow(
      "JobOpening",
      {
        title: title.slice(0, 120),
        description: description.slice(0, 4000),
        specialties: corpo.specialties ? String(corpo.specialties).slice(0, 300) : null,
        unitIds: corpo.unitIds ? String(corpo.unitIds).slice(0, 300) : null,
        status: "Aberta",
        expiresAt,
      },
      // A tabela exige updatedAt: sem nomear os dois campos, insertRow preenche
      // só createdAt e o banco recusa a linha.
      { withTimestamps: true, timestampFields: ["createdAt", "updatedAt"] }
    );

    await logAccess({
      action: "CRIAR",
      entity: "JobOpening",
      detail: `Publicou a vaga "${title.slice(0, 80)}" no site.`,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Falha ao cadastrar vaga:", err);
    return NextResponse.json({ erro: "Não foi possível salvar a vaga." }, { status: 500 });
  }
}
