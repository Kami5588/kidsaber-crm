"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2, AlertTriangle, Clock, Eye, EyeOff } from "lucide-react";

/** Ícone do Google, desenhado aqui porque o lucide não traz logotipos de marca. */
function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, { title: string; body: string; tone: "warning" | "danger" }> = {
  AGUARDANDO_APROVACAO: {
    title: "Acesso aguardando liberação",
    body:
      "Recebemos seu pedido de entrada. A direção da clínica precisa liberar o seu acesso antes do primeiro uso. Você será avisada assim que for aprovada.",
    tone: "warning",
  },
  OAuthAccountNotLinked: {
    title: "Conta já cadastrada com senha",
    body: "Este e-mail já entra com senha. Use o formulário abaixo ou peça a redefinição à administração.",
    tone: "warning",
  },
  AccessDenied: {
    title: "Acesso negado",
    body: "Sua conta não tem permissão para entrar. Fale com a administração da clínica.",
    tone: "danger",
  },
};

export default function LoginForm({
  googleEnabled,
  initialError,
}: {
  googleEnabled: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const notice = initialError ? ERROR_MESSAGES[initialError] : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      // O NextAuth devolve a mensagem lançada em authorize, que já explica se
      // faltam tentativas ou se a conta está bloqueada.
      setError(res.error === "CredentialsSignin" ? "E-mail ou senha inválidos." : res.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-navy-100 bg-white p-8 shadow-xl shadow-navy-900/5">
        <h1 className="text-2xl font-extrabold text-navy-800">Entrar no sistema</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Acesso restrito à equipe da Clínica KidSaber.
        </p>

        {notice && (
          <div
            role="status"
            className={`mt-6 flex gap-3 rounded-2xl border p-4 ${
              notice.tone === "warning"
                ? "border-gold-200 bg-gold-50"
                : "border-coral-200 bg-coral-50"
            }`}
          >
            {notice.tone === "warning" ? (
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-900" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-600" />
            )}
            <div>
              <p
                className={`text-sm font-bold ${
                  notice.tone === "warning" ? "text-gold-900" : "text-coral-800"
                }`}
              >
                {notice.title}
              </p>
              <p
                className={`mt-1 text-xs leading-relaxed ${
                  notice.tone === "warning" ? "text-gold-800" : "text-coral-900/80"
                }`}
              >
                {notice.body}
              </p>
            </div>
          </div>
        )}

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={() => {
                setGoogleLoading(true);
                signIn("google", { callbackUrl: "/dashboard" });
              }}
              disabled={googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-navy-300 hover:bg-slate-50 disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Entrar com conta Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-600">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className={`space-y-5 ${googleEnabled ? "" : "mt-6"}`}>
          <div>
            <label htmlFor="email" className="label">E-mail</label>
            <div className="relative">
              <Mail aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "erro-login" : undefined}
                className="input input-with-icon"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Senha</label>
            <div className="relative">
              <Lock aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="password"
                type={mostrarSenha ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "erro-login" : undefined}
                className="input input-with-icon pr-11"
              />
              {/*
                Digitar às cegas numa senha de doze caracteres gerada pela
                administração é a causa mais comum de bloqueio por tentativas.
              */}
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {mostrarSenha ? (
                  <EyeOff aria-hidden className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              id="erro-login"
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700"
            >
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn aria-hidden className="h-4 w-4" />
            )}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
        Problemas para entrar? Fale com a administração da clínica.
      </p>
    </div>
  );
}
