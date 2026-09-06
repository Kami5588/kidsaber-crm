export { default } from "next-auth/middleware";

export const config = {
  /**
   * Protege tudo, exceto o que precisa ser público:
   *   $                     -> a raiz "/" (landing page)
   *   login                 -> tela de acesso
   *   termos, privacidade   -> páginas legais
   *   api/auth              -> rotas do NextAuth
   *   api/candidaturas      -> envio de currículo pelo site
   *   _next/*               -> assets gerados pelo build
   *   imagens e ícones      -> arquivos de /public (logo, favicon)
   *
   * A lista de extensões cobre só o que existe em /public. Documentos como PDF
   * ficam de fora de propósito: os laudos são servidos por /api/documentos,
   * que exige sessão e confere permissão antes de devolver o arquivo.
   *
   * O "$" em api/candidaturas libera apenas o envio, que é público por
   * natureza. O caminho mais fundo — /api/candidaturas/<id>/curriculo, que
   * entrega o documento de um candidato — continua protegido aqui, além de
   * exigir perfil de administração dentro da própria rota.
   */
  matcher: [
    "/((?!$|login|termos|privacidade|api/auth|api/candidaturas$|_next/static|_next/image|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
};
