import { NextResponse } from "next/server";
import { insertRow } from "@/lib/orm";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const candidateName = formData.get("candidateName");
    const candidateEmail = formData.get("candidateEmail");
    const candidatePhone = formData.get("candidatePhone");
    const resumeFile = formData.get("resume") as File;

    if (!candidateName || !candidateEmail || !candidatePhone || !resumeFile) {
      return NextResponse.json(
        { erro: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Limita o tamanho do arquivo
    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { erro: "Arquivo muito grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    // Converte o arquivo para buffer
    const buffer = await resumeFile.arrayBuffer();
    const resumeData = Buffer.from(buffer);

    insertRow("JobApplication", {
      jobId: null, // Não está vinculado a uma vaga específica, é candidatura aberta
      candidateName: String(candidateName),
      candidateEmail: String(candidateEmail),
      candidatePhone: String(candidatePhone),
      resumeFileName: resumeFile.name,
      resumeData,
      status: "Novo",
    });

    // Envia email de confirmação
    const message = `
Nova candidatura recebida:
- Nome: ${candidateName}
- Email: ${candidateEmail}
- Telefone: ${candidatePhone}
- Arquivo: ${resumeFile.name}

Acesse o painel de vagas no KidSaber Connect para revisar.
    `;

    // Aqui você poderia integrar com um serviço de email
    // Por enquanto, apenas registra no banco
    console.log("Candidatura recebida:", { candidateName, candidateEmail });

    return NextResponse.json({ sucesso: true }, { status: 201 });
  } catch (err) {
    console.error("Erro ao processar candidatura:", err);
    return NextResponse.json(
      { erro: "Erro ao processar candidatura" },
      { status: 500 }
    );
  }
}
