export { default } from "next-auth/middleware";

export const config = {
  /**
   * Protege tudo, exceto o que precisa ser público:
   *   $                     -> a raiz "/" (landing page)
   *   login                 -> tela de acesso
   *   termos, privacidade   -> páginas legais
   *   api/auth              -> rotas do NextAuth
   *   _next/*               -> assets gerados pelo build
   *   arquivos com extensão -> tudo que mora em /public (logo, ícones, imagens)
   *
   * A última regra importa: sem ela, a logo da landing era redirecionada para o
   * login e o site aparecia sem imagem nenhuma para quem não estava logado.
   */
  matcher: [
    "/((?!$|login|termos|privacidade|api/auth|_next/static|_next/image|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif|pdf|txt|xml|webmanifest)$).*)",
  ],
};
