export { default } from "next-auth/middleware";

export const config = {
  /**
   * Protege tudo, exceto o que precisa ser público:
   *   $                     -> a raiz "/" (landing page)
   *   login                 -> tela de acesso
   *   termos, privacidade   -> páginas legais
   *   api/auth              -> rotas do NextAuth
   *   _next/*               -> assets gerados pelo build
   *   imagens e ícones      -> arquivos de /public (logo, favicon)
   *
   * A lista de extensões cobre só o que existe em /public. Documentos como PDF
   * ficam de fora de propósito: os laudos são servidos por /api/documentos,
   * que exige sessão e confere permissão antes de devolver o arquivo.
   */
  matcher: [
    "/((?!$|login|termos|privacidade|api/auth|_next/static|_next/image|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
};
