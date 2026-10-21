import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/");
  const firstSegment = segments[1];

  // If URL has a /en or /id prefix, redirect to clean URL and save preference cookie
  if (firstSegment && (routing.locales as readonly string[]).includes(firstSegment)) {
    const remaining = segments.slice(2).join("/");
    const newPathname = remaining ? `/${remaining}` : "/";
    const url = request.nextUrl.clone();
    url.pathname = newPathname;

    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", firstSegment, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..+).*)"],
};
