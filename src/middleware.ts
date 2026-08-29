export { default } from "next-auth/middleware";

export const config = {
  // Protege tudo, exceto o que precisa ser público:
  //   $                     -> a raiz "/" (landing page)
  //   login                 -> tela de acesso
  //   termos, privacidade   -> páginas legais
  //   api/auth              -> rotas do NextAuth
  //   _next, favicon, images, uploads -> assets estáticos
  matcher: [
    "/((?!$|login|termos|privacidade|api/auth|_next/static|_next/image|favicon.ico|images|uploads).*)",
  ],
};
