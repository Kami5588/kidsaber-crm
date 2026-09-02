import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "KidSaber Connect",
  description: "Sistema de gestão da Clínica KidSaber",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased text-slate-800">
        {/*
          Primeiro item da ordem de tabulação: quem navega por teclado pula a
          barra lateral inteira em vez de percorrer todos os links a cada
          página. Fica invisível até receber foco.
        */}
        <a href="#conteudo" className="sr-only-focusable">
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
