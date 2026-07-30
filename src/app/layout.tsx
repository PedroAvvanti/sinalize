import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { normalizeThemePreference } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sinalize",
  description:
    "Conexão entre pessoas surdas e intérpretes de Libras por videochamadas agendadas.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  let initialTheme = normalizeThemePreference(null);

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", userId)
      .single();

    initialTheme = normalizeThemePreference(profile?.theme_preference);
  }

  return (
    <html data-theme={initialTheme} lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
