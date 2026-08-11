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
                        <Providers>{children}</Providers>
                              </body>
                                  </html>
                                    );
                                    }
                                    
