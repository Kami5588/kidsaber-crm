import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { rawGet, updateRow } from "./orm";
import { checkLogin, recordAttempt, pruneLoginAttempts } from "./login-guard";
import { logAccessRaw } from "./audit";
import { recordAccessRequest } from "./access-requests";

/** Mensagem única para senha errada e usuário inexistente. */
const INVALID = "Credenciais inválidas.";

/** Mostrada a quem entrou com Google mas ainda não foi liberado pela direção. */
export const PENDING_APPROVAL = "AGUARDANDO_APROVACAO";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

/** O botão do Google só existe quando as credenciais estão configuradas. */
export const googleEnabled = Boolean(googleId && googleSecret);

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credenciais",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = credentials.email.trim().toLowerCase();
      const forwarded = (req?.headers?.["x-forwarded-for"] as string) ?? null;
      const ip = forwarded ? forwarded.split(",")[0].trim() : null;
      const userAgent = (req?.headers?.["user-agent"] as string) ?? null;

      pruneLoginAttempts();

      const guard = checkLogin(email);
      if (!guard.allowed) {
        logAccessRaw({
          action: "LOGIN_BLOQUEADO",
          userEmail: email,
          detail: `Bloqueado por excesso de tentativas. Liberação em ${guard.retryInMinutes} min.`,
          ip,
          userAgent,
        });
        throw new Error(
          `Muitas tentativas. Tente novamente em ${guard.retryInMinutes} minuto(s).`
        );
      }

      const user = rawGet("SELECT * FROM User WHERE lower(email) = ?", [email]);

      // Usuário inexistente e senha errada devolvem a mesma resposta, para não
      // revelar quais e-mails existem no sistema.
      const valid =
        user && user.passwordHash
          ? await bcrypt.compare(credentials.password, user.passwordHash)
          : false;

      if (!valid) {
        recordAttempt(email, false);
        const left = Math.max(0, guard.attemptsLeft - 1);
        logAccessRaw({
          action: "LOGIN_FALHA",
          userEmail: email,
          detail: `${INVALID} Tentativas restantes: ${left}.`,
          ip,
          userAgent,
        });
        throw new Error(
          left > 0
            ? `${INVALID} Você tem mais ${left} tentativa(s) antes do bloqueio.`
            : `${INVALID} Acesso bloqueado temporariamente.`
        );
      }

      if (user.active === 0) {
        logAccessRaw({
          action: "LOGIN_BLOQUEADO",
          userEmail: email,
          detail: "Conta desativada.",
          ip,
          userAgent,
        });
        throw new Error("Esta conta está desativada. Fale com a administração.");
      }

      recordAttempt(email, true);
      updateRow("User", user.id, { lastLoginAt: new Date().toISOString() });

      logAccessRaw({
        action: "LOGIN_SUCESSO",
        userEmail: user.email,
        entity: "User",
        entityId: user.id,
        detail: "Entrada com e-mail e senha.",
        ip,
        userAgent,
      });

      return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
    },
  }),
];

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: googleId!,
      clientSecret: googleSecret!,
      // `select_account` força a escolha da conta, em vez de reaproveitar a
      // última sessão do navegador — importante num computador compartilhado
      // pela recepção.
      authorization: { params: { prompt: "select_account" } },
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    /**
     * Porteiro do login com Google.
     *
     * Ter uma conta Google não basta: só entra quem já tem cadastro ativo no
     * sistema. Quem não tem vira um pedido de acesso para a direção aprovar.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const existing = rawGet("SELECT * FROM User WHERE lower(email) = ?", [email]);

      if (!existing) {
        recordAccessRequest({
          email,
          name: user.name ?? (profile as any)?.name ?? null,
          picture: user.image ?? null,
        });
        logAccessRaw({
          action: "LOGIN_BLOQUEADO",
          userEmail: email,
          detail: "Entrada com Google sem cadastro. Pedido de acesso registrado.",
        });
        return `/login?error=${PENDING_APPROVAL}`;
      }

      if (existing.active === 0) {
        logAccessRaw({
          action: "LOGIN_BLOQUEADO",
          userEmail: email,
          detail: "Entrada com Google em conta desativada.",
        });
        return `/login?error=${PENDING_APPROVAL}`;
      }

      // Guarda a foto do Google e marca o último acesso.
      updateRow("User", existing.id, {
        authProvider: "google",
        picture: user.image ?? existing.picture ?? null,
        lastLoginAt: new Date().toISOString(),
      });

      logAccessRaw({
        action: "LOGIN_SUCESSO",
        userEmail: existing.email,
        entity: "User",
        entityId: existing.id,
        detail: "Entrada com conta Google.",
      });

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
