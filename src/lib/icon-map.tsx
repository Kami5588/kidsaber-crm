import {
  Users, UserRound, Stethoscope, CalendarClock, Megaphone, ShieldCheck,
  ClipboardList, Wallet, ListChecks, MessagesSquare, Hourglass, FileText,
  Smile, LayoutDashboard, Building2, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Users, UserRound, Stethoscope, CalendarClock, Megaphone, ShieldCheck,
  ClipboardList, Wallet, ListChecks, MessagesSquare, Hourglass, FileText,
  Smile, LayoutDashboard, Building2,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Users;
}
