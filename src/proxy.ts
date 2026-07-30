import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isProfileRecoveryRequest,
  profileUnavailableLoginPath,
} from "@/lib/auth/policy";
import { homePathForRole, type ProfileRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database";

function isProfileRole(role: unknown): role is ProfileRole {
  return role === "user" || role === "interpreter" || role === "admin";
}

function redirectWithCookies(
  response: NextResponse,
  destination: URL,
) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

function isAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  const { pathname, search } = request.nextUrl;

  if (!userId && isAppPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(response, loginUrl);
  }

  if (!userId) {
    return response;
  }

  if (
    isProfileRecoveryRequest(
      pathname,
      request.nextUrl.searchParams.get("error"),
    )
  ) {
    await supabase.auth.signOut();
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = profile?.role;

  if (!isProfileRole(role)) {
    await supabase.auth.signOut();
    return redirectWithCookies(
      response,
      new URL(profileUnavailableLoginPath(), request.url),
    );
  }

  const homePath = homePathForRole(role);

  if (pathname === "/login" || pathname === "/signup" || pathname === "/app") {
    return redirectWithCookies(
      response,
      new URL(homePath, request.url),
    );
  }

  const roleRoute = pathname.match(
    /^\/app\/(user|interpreter|admin)(?:\/|$)/,
  )?.[1];

  if (roleRoute && roleRoute !== role) {
    return redirectWithCookies(
      response,
      new URL(homePath, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
