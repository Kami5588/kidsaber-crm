import Image from "next/image";

/**
 * Marca da KidSaber.
 *
 * A logo oficial é quadrada (mascote em cima, nome embaixo), o que não encaixa
 * numa barra horizontal. Para o cabeçalho, enquadramos só o mascote ampliando a
 * imagem e posicionando o recorte; o arquivo completo é usado onde há espaço
 * vertical (login, rodapé).
 */
export function BrandMascot({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Mascote da Clínica KidSaber"
      className={`block flex-shrink-0 rounded-2xl bg-white bg-[url('/logo-kidsaber.png')] bg-[length:190%_auto] bg-[position:50%_18%] bg-no-repeat shadow-sm ring-1 ring-navy-100 ${className}`}
    />
  );
}

export function BrandLogo({
  className = "",
  width = 220,
  height = 220,
  priority = false,
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo-kidsaber.png"
      alt="Clínica KidSaber"
      width={width}
      height={height}
      priority={priority}
      // O otimizador de imagens do Next recusa este PNG ("isn't a valid image"),
      // por falta de decodificador no ambiente. Servir o arquivo original evita
      // a dependência nativa do sharp e funciona igual em qualquer host.
      unoptimized
      className={className}
    />
  );
}

/** Assinatura horizontal: mascote + nome, usada no cabeçalho e no rodapé. */
export function BrandLockup({
  tone = "light",
  subtitle = "Desenvolvimento infantil",
}: {
  tone?: "light" | "dark";
  subtitle?: string;
}) {
  const name = tone === "dark" ? "text-white" : "text-navy-800";
  const sub = tone === "dark" ? "text-teal-200" : "text-teal-700";

  return (
    <span className="flex items-center gap-3">
      <BrandMascot />
      <span className="leading-tight">
        <span className={`block text-base font-extrabold tracking-tight ${name}`}>
          <span className="text-coral-500">Kid</span>
          <span className={tone === "dark" ? "text-teal-300" : "text-navy-600"}>Saber</span>
        </span>
        <span className={`block text-[11px] font-medium ${sub}`}>{subtitle}</span>
      </span>
    </span>
  );
}
