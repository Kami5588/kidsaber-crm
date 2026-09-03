import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { insertRow } from "@/lib/orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, specialties, unitIds, expiresAt } = body;

  if (!title || !description) {
    return NextResponse.json(
      { erro: "Título e descrição são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    insertRow("JobOpening", {
      title,
      description,
      specialties: specialties || null,
      unitIds: unitIds || null,
      status: "Aberta",
      expiresAt: expiresAt || null,
    });

    return NextResponse.json({ sucesso: true }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar vaga:", err);
    return NextResponse.json(
      { erro: "Erro ao criar vaga" },
      { status: 500 }
    );
  }
}
