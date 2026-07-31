import { BottomNav, USER_BOTTOM_NAV_ITEMS } from "@/components/layout/BottomNav";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="user-shell">
      {children}
      <BottomNav items={USER_BOTTOM_NAV_ITEMS} />
    </div>
  );
}
