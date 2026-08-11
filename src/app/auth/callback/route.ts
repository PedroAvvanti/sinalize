import { NextResponse } from "next/server";

import { decideProfileAccess } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

function redirectOrigin(requestUrl: URL, request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return requestUrl.origin;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return requestUrl.origin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = redirectOrigin(requestUrl, request);

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Falha ao trocar código de confirmação por sessão.", {
      code: error.code,
      status: error.status,
    });
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const access = decideProfileAccess(profile?.role, Boolean(profileError));

  if (access.kind === "authenticated") {
    return NextResponse.redirect(`${origin}${access.destination}`);
  }

  if (access.kind === "recover") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}${access.destination}`);
  }

  return NextResponse.redirect(`${origin}/app`);
}
