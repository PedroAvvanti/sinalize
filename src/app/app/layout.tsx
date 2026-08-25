import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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

  const usesAppTabs =
    profile.role === "user" || profile.role === "interpreter";
  const avatarHref =
    profile.role === "user"
      ? "/app/user/profile"
      : profile.role === "interpreter"
        ? "/app/interpreter/profile"
        : `/app/${profile.role}`;
  const initials = getInitials(profile.full_name ?? "");

  return (
    <ThemeProvider
      initialTheme={normalizeThemePreference(profile.theme_preference)}
    >
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <Image src="/logo.png" alt="" width={64} height={64} priority />
            <span>Sinalize</span>
          </div>
          <div className="app-account">
            <NotificationBell
              userId={userId}
              initialUnread={unreadNotifications ?? 0}
            />
            {!usesAppTabs ? (
              <>
                <ThemeToggle />
                <form action={signOutAction}>
                  <button className="app-signout" type="submit">
                    Sair
                  </button>
                </form>
              </>
            ) : null}
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
