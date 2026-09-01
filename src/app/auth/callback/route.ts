import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  parseEmailConfirmParams,
  resolveEmailConfirmDestination,
} from "@/lib/auth/email-confirm";
import type { Database } from "@/types/database";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

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

function redirectWithCookies(origin: string, path: string, cookies: CookieToSet[]) {
  const response = NextResponse.redirect(`${origin}${path}`);

  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = redirectOrigin(requestUrl, request);
  const confirmParams = parseEmailConfirmParams(requestUrl.searchParams);

  if (confirmParams.kind === "invalid") {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    },
  );

  const exchangeError =
    confirmParams.kind === "token_hash"
      ? (
          await supabase.auth.verifyOtp({
            type: confirmParams.type,
            token_hash: confirmParams.token_hash,
          })
        ).error
      : (await supabase.auth.exchangeCodeForSession(confirmParams.code)).error;

  if (exchangeError) {
    console.error("Falha ao confirmar e-mail e criar sessão.", {
      code: exchangeError.code,
      status: exchangeError.status,
      kind: confirmParams.kind,
    });
    return redirectWithCookies(origin, "/login", cookiesToSet);
  }

  if (
    confirmParams.kind === "token_hash" &&
    confirmParams.type === "recovery"
  ) {
    return redirectWithCookies(origin, "/reset-password", cookiesToSet);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithCookies(origin, "/login", cookiesToSet);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const destination = resolveEmailConfirmDestination(
    profile?.role,
    Boolean(profileError),
  );

  if (destination.startsWith("/login")) {
    await supabase.auth.signOut();
  }

  return redirectWithCookies(origin, destination, cookiesToSet);
}
