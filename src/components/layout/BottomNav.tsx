"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type BottomNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ReactNode;
  /** Only match the exact path (use for role home routes). */
  end?: boolean;
  disabled?: boolean;
};

type BottomNavProps = {
  items: BottomNavItem[];
};

function isItemActive(pathname: string, item: BottomNavItem) {
  if (item.end) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavIconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NavIconHistory() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function NavIconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c1.5-3 4.5-4.5 7-4.5s5.5 1.5 7 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NavIconQueue() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h10M5 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NavIconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconMore() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <ul
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const active = isItemActive(pathname, item);
          const label = item.shortLabel ?? item.label;

          if (item.disabled) {
            return (
              <li key={item.label}>
                <span className="bottom-nav__item bottom-nav__item-disabled">
                  <span className="bottom-nav__icon">{item.icon}</span>
                  {label}
                  <small>Em breve</small>
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                className={
                  active
                    ? "bottom-nav__item bottom-nav__item-active"
                    : "bottom-nav__item"
                }
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <span className="bottom-nav__icon">{item.icon}</span>
                <span className="bottom-nav__label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const USER_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/app/user", label: "Início", icon: <NavIconHome />, end: true },
  { href: "/app/user/request", label: "Pedidos", icon: <NavIconCalendar /> },
  { href: "/app/user/history", label: "Histórico", icon: <NavIconHistory /> },
  { href: "/app/user/profile", label: "Perfil", icon: <NavIconUser /> },
];

export const INTERPRETER_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/app/interpreter", label: "Fila", icon: <NavIconQueue />, end: true },
  { href: "/app/interpreter/agenda", label: "Agenda", icon: <NavIconCalendar /> },
  { href: "/app/interpreter/profile", label: "Perfil", icon: <NavIconUser /> },
];

export const ADMIN_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/app/admin", label: "Mesa", shortLabel: "Mesa", icon: <NavIconShield />, end: true },
  {
    href: "/app/admin/interpreters",
    label: "Candidatos",
    shortLabel: "Cand.",
    icon: <NavIconUser />,
  },
  {
    href: "/app/admin/cancellations",
    label: "Cancelamentos",
    shortLabel: "Cancel.",
    icon: <NavIconHistory />,
  },
  {
    href: "/app/admin/appointments",
    label: "Atendimentos",
    shortLabel: "Atend.",
    icon: <NavIconCalendar />,
  },
  {
    href: "/app/admin/profile",
    label: "Perfil e mais",
    shortLabel: "Mais",
    icon: <NavIconMore />,
  },
];
