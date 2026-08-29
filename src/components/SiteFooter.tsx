import Link from "next/link";
import { Mail, Phone, Clock } from "lucide-react";
import { BrandMascot } from "./BrandMark";
import {
  CLINIC_NAME, PHONE_DISPLAY, EMAIL, BUSINESS_HOURS, WHATSAPP_URL, SOCIAL,
} from "@/lib/clinic";
import { listUnits } from "@/lib/units";


type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22.5 6.9a3 3 0 0 0-2.1-2.1C18.6 4.3 12 4.3 12 4.3s-6.6 0-8.4.5A3 3 0 0 0 1.5 6.9 31 31 0 0 0 1 12a31 31 0 0 0 .5 5.1 3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-5.1z" />
      <path d="m9.8 15.3 5.4-3.3-5.4-3.3z" />
    </svg>
  );
}

export default function SiteFooter({ anchors = true }: { anchors?: boolean }) {
  const href = (hash: string) => (anchors ? hash : `/${hash}`);
  const units = listUnits();

  const socials = [
    { url: SOCIAL.instagram, Icon: InstagramIcon, label: "Instagram" },
    { url: SOCIAL.facebook, Icon: FacebookIcon, label: "Facebook" },
    { url: SOCIAL.youtube, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="bg-brand-hero text-teal-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <BrandMascot className="h-12 w-12" />
              <span className="leading-tight">
                <span className="block text-base font-extrabold text-white">{CLINIC_NAME}</span>
                <span className="block text-xs text-teal-200">Desenvolvimento infantil</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-teal-100/80">
              Cuidado especializado para o desenvolvimento infantil, com acolhimento,
              ciência e propósito.
            </p>

            {socials.length > 0 && (
              <div className="mt-5 flex gap-2.5">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold-400">
              Navegação
            </h3>
            <nav className="flex flex-col gap-2.5 text-sm">
              <a href={href("#especialidades")} className="transition hover:text-white">Especialidades</a>
              <a href={href("#como-funciona")} className="transition hover:text-white">Como funciona</a>
              <a href={href("#unidades")} className="transition hover:text-white">Unidades</a>
              <a href={href("#contato")} className="transition hover:text-white">Contato</a>
              <Link href="/login" className="transition hover:text-white">Área restrita</Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold-400">
              Unidades
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {units.map((u) => (
                <li key={u.id}>
                  {u.name} · {u.state}
                  {u.isMain ? <span className="ml-1.5 text-xs text-teal-300">(sede)</span> : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold-400">
              Contato
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-300" />
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-300" />
                <a href={`mailto:${EMAIL}`} className="break-all transition hover:text-white">
                  {EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-300" />
                <span>{BUSINESS_HOURS}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-teal-100/70">
          <p>© {new Date().getFullYear()} {CLINIC_NAME}. Todos os direitos reservados.</p>
          <nav className="flex gap-5">
            <Link href="/privacidade" className="transition hover:text-white">Política de Privacidade</Link>
            <Link href="/termos" className="transition hover:text-white">Termos de Uso</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
