import { NextResponse } from "next/server";
import { ErroCandidatura, registrarCandidatura } from "@/lib/recrutamento";

/**
 * Recebe a candidatura enviada pelo site.
 *
 * A rota é pública, então a validação inteira mora no servidor: o que o
 * formulário confere no navegador é conveniência, não barreira.
 */
export async function POST(request: Request) {
  const encaminhado = request.headers.get("x-forwarded-for");
  const ip = encaminhado ? encaminhado.split(",")[0]!.trim() : null;

  try {
    const form = await request.formData();

    const unidades = form
      .getAll("unidades")
      .map((u) => String(u).trim())
      .filter(Boolean);

    await registrarCandidatura({
      nome: String(form.get("nome") ?? ""),
      email: String(form.get("email") ?? ""),
      telefone: String(form.get("telefone") ?? ""),
      unidades,
      vagaId: form.get("vagaId") ? String(form.get("vagaId")) : null,
      curriculo: form.get("curriculo") as File,
      ip,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    // Erro de preenchimento volta explicado; qualquer outro vira mensagem
    // genérica, para não expor detalhe interno a uma rota pública.
    if (err instanceof ErroCandidatura) {
      return NextResponse.json({ erro: err.message }, { status: 400 });
    }
    console.error("Falha ao registrar candidatura:", err);
    return NextResponse.json(
      { erro: "Não foi possível enviar agora. Tente novamente em alguns minutos." },
      { status: 500 }
    );
  }
}
