import {
  ADMIN_BOTTOM_NAV_ITEMS,
  BottomNav,
} from "@/components/layout/BottomNav";

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-shell">
      {children}
      <BottomNav items={ADMIN_BOTTOM_NAV_ITEMS} />
    </div>
  );
}
