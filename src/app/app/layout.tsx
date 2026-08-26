import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { getInitials } from "@/lib/profile/initials";
import { createClient } from "@/lib/supabase/server";
import { normalizeThemePreference } from "@/lib/theme";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, theme_preference, role")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect(profileUnavailableLoginPath());
  }

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .is("read_at", null);

  const avatarHref =
    profile.role === "user"
      ? "/app/user/profile"
      : profile.role === "interpreter"
        ? "/app/interpreter/profile"
        : profile.role === "admin"
          ? "/app/admin/profile"
          : `/app/${profile.role}`;
  const initials = getInitials(profile.full_name ?? "");

  return (
    <ThemeProvider
      initialTheme={normalizeThemePreference(profile.theme_preference)}
    >
      <div className="app-shell">
        <header className="app-header">
          <Link
            className="brand"
            href={`/app/${profile.role}`}
            aria-label="Ir para o início"
          >
            <Image src="/logo.png" alt="" width={64} height={64} priority />
            <span>Sinalize</span>
          </Link>
          <div className="app-account">
            <NotificationBell
              userId={userId}
              initialUnread={unreadNotifications ?? 0}
            />
            <Link
              className="app-avatar-link"
              href={avatarHref}
              aria-label="Abrir perfil"
            >
              {initials}
            </Link>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </ThemeProvider>
  );
}
