import Image from "next/image";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
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
    .select("full_name, theme_preference")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect(profileUnavailableLoginPath());
  }

  return (
    <ThemeProvider
      initialTheme={normalizeThemePreference(profile.theme_preference)}
    >
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <Image src="/logo.png" alt="" width={48} height={48} priority />
            <span>Sinalize</span>
          </div>
          <div className="app-account">
            <span className="app-user-name">{profile.full_name}</span>
            <ThemeToggle />
            <form action={signOutAction}>
              <button className="app-signout" type="submit">
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </ThemeProvider>
  );
}
