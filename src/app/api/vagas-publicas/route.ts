import { NextResponse } from "next/server";
import { vagasAbertas } from "@/lib/recrutamento";

/** Vagas mostradas no site. Só o que já é público: nada de candidatos aqui. */
export async function GET() {
  return NextResponse.json(vagasAbertas());
}
