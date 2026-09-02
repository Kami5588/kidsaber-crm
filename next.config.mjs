/**
 * Cabeçalhos de segurança aplicados a todas as respostas.
 *
 * A CSP permite `unsafe-inline` em script e style porque o Next injeta scripts
 * de hidratação e o Tailwind gera estilos inline; restringir mais exigiria
 * nonce por requisição, o que não compensa aqui. O ganho real está em
 * `frame-ancestors`, `form-action` e `base-uri`, que fecham clickjacking e
 * sequestro de formulário.
 */
// O 'unsafe-eval' só é necessário para o recarregamento a quente do Next em
// desenvolvimento. Mantê-lo em produção abriria eval() para qualquer script
// injetado, sem nenhum ganho.
const emDesenvolvimento = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      emDesenvolvimento
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      // Nenhuma página de terceiro embutida e nenhum plugin: o sistema não usa
      // nem um nem outro, e prontuário não deveria carregar conteúdo de fora.
      "frame-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; "),
  },
  // Força HTTPS nas visitas seguintes. O Railway e a Hostinger já servem em
  // HTTPS, então não há risco de trancar o acesso.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: { instrumentationHook: true },
  // Não anunciar o servidor usado é uma barreira a menos para quem varre alvos.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
