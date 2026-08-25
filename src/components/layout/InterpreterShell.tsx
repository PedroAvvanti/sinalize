"use client";

import { usePathname } from "next/navigation";

import {
  BottomNav,
  INTERPRETER_BOTTOM_NAV_ITEMS,
} from "@/components/layout/BottomNav";

export function InterpreterShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNav = !pathname.startsWith("/app/interpreter/onboarding");

  return (
    <div className={showNav ? "interpreter-shell" : undefined}>
      {children}
      {showNav ? <BottomNav items={INTERPRETER_BOTTOM_NAV_ITEMS} /> : null}
    </div>
  );
}
