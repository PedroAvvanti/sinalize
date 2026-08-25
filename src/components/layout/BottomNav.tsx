"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavItem = {
  href: string;
  label: string;
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

          if (item.disabled) {
            return (
              <li key={item.label}>
                <span className="bottom-nav__item bottom-nav__item-disabled">
                  {item.label}
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
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const USER_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/app/user", label: "Início", end: true },
  { href: "/app/user/request", label: "Pedidos" },
  { href: "/app/user/history", label: "Histórico" },
  { href: "/app/user/profile", label: "Perfil" },
];

export const INTERPRETER_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/app/interpreter", label: "Fila", end: true },
  { href: "/app/interpreter/agenda", label: "Agenda" },
  { href: "/app/interpreter/profile", label: "Perfil" },
];
