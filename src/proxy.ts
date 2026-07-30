import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { decideProfileAccess } from "@/lib/auth/policy";
import { resolveInterpreterRedirect } from "@/lib/interpreters/application";
import type { Database } from "@/types/database";

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const profileAccess = decideProfileAccess(
    profile?.role,
    Boolean(profileError),
  );

  if (profileAccess.kind === "indeterminate") {
    return response;
  }

  if (profileAccess.signOut) {
    await supabase.auth.signOut();
    return redirectWithCookies(
      response,
      new URL(profileAccess.destination, request.url),
    );
  }

  const { destination: homePath, role } = profileAccess;

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

  if (
    role === "interpreter" &&
    (pathname === "/app/interpreter" ||
      pathname.startsWith("/app/interpreter/"))
  ) {
    const { data: application, error: applicationError } = await supabase
      .from("interpreter_applications")
      .select("status")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!applicationError) {
      const interpreterRedirect = resolveInterpreterRedirect(
        pathname,
        application?.status ?? null,
      );

      if (interpreterRedirect) {
        return redirectWithCookies(
          response,
          new URL(interpreterRedirect, request.url),
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
