
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  const isAuthCallback = pathname === "/auth/callback";

  // Allow OAuth callback to complete before requiring a session.
  if (!claims && !isAuthPage && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);

    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(
        cookie.name,
        cookie.value,
        cookie
      );
    });

    return redirectResponse;
  }

  if (claims && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";

    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(
        cookie.name,
        cookie.value,
        cookie
      );
    });

    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
