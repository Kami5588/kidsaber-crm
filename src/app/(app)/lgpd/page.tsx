import { getServerSession } from "next-auth";
import { ShieldCheck, Lock, ScrollText, KeyRound } from "lucide-react";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { listPatientsForLgpd } from "@/lib/lgpd";
import { isEncryptionEnabled } from "@/lib/crypto";
import LgpdPanel from "@/components/LgpdPanel";

export const metadata = { title: "Direitos do titular · KidSaber Connect" };

export default async function LgpdPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const patients = listPatientsForLgpd();
  const encryption = isEncryptionEnabled();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Proteção de dados</h1>
        <p className="text-slate-600">
          Ferramentas para atender pedidos de acesso, portabilidade e eliminação previstos na LGPD.
        </p>
      </div>

      {/* Estado das proteções ativas */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-start gap-3 p-5">
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              encryption ? "bg-teal-50 text-teal-700" : "bg-gold-50 text-gold-900"
            }`}
          >
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Criptografia em repouso</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {encryption
                ? "Ativa. Diagnósticos, evoluções e notas são cifrados no banco."
                : "Inativa. Defina ENCRYPTION_KEY para cifrar os dados sensíveis."}
            </p>
          </div>
        </div>

        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Trilha de auditoria</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Ativa.{" "}
              <Link href="/auditoria" className="font-medium text-navy-600 hover:underline">
                Ver registros de acesso
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Proteção do login</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Ativa. Cinco tentativas erradas bloqueiam o acesso por 15 minutos.
            </p>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <LgpdPanel
          patients={patients.map((p) => ({
            id: p.id,
            fullName: p.fullName,
            unidade: p.unidade,
            status: p.status,
          }))}
        />
      ) : (
        <div className="card flex items-start gap-3 p-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-600" />
          <div>
            <p className="font-semibold text-slate-800">Acesso restrito</p>
            <p className="mt-1 text-sm text-slate-600">
              Exportar ou eliminar dados de um titular é uma ação da administração da clínica.
              Peça a quem tem perfil de administrador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
