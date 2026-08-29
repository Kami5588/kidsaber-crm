import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { rawGet } from "./orm";
import { checkLogin, recordAttempt, pruneLoginAttempts } from "./login-guard";
import { logAccessRaw } from "./audit";

/** Mensagem única para senha errada e usuário inexistente. */
const INVALID = "Credenciais inválidas.";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
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

        // 1. Bloqueio por excesso de tentativas
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
        const valid = user
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

        recordAttempt(email, true);
        logAccessRaw({
          action: "LOGIN_SUCESSO",
          userEmail: user.email,
          entity: "User",
          entityId: user.id,
          ip,
          userAgent,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
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
