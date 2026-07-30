import { redirect } from "next/navigation";

import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { homePathForRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect(profileUnavailableLoginPath());
  }

  redirect(homePathForRole(profile.role));
}
