import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const pathname = request.nextUrl.pathname;
  const publicPaths = ["/login", "/signup"];

  if (!user && !publicPaths.includes(pathname) && pathname !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && publicPaths.includes(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  if (user && (pathname.startsWith("/manager") || pathname.startsWith("/member"))) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return response;

    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => undefined,
      },
    });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pathname.startsWith("/manager") && profile?.role !== "manager") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/member";
      return NextResponse.redirect(redirectUrl);
    }
    if (pathname.startsWith("/member") && profile?.role !== "member") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/manager";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
