import { NextResponse } from "next/server";

import { decideProfileAccess } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling da aba /confirm: lê cookies da sessão (incl. HttpOnly) no servidor,
 * porque o client da aba de espera não vê a sessão criada no /auth/callback.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ destination: null });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const access = decideProfileAccess(profile?.role, Boolean(profileError));

  if (access.kind !== "authenticated") {
    return NextResponse.json({ destination: null });
  }

  return NextResponse.json({ destination: access.destination });
}
