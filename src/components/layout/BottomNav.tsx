"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

type BottomNavProps = {
  items: BottomNavItem[];
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <ul>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app/user" && pathname.startsWith(item.href));

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
  { href: "/app/user", label: "Início" },
  { href: "/app/user/request", label: "Pedidos" },
  { href: "/app/user/history", label: "Histórico", disabled: true },
  { href: "/app/user/profile", label: "Perfil", disabled: true },
];
