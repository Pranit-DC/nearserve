import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the session token from cookies
  const sessionToken = request.cookies.get('__session')?.value;
  
  // Define protected paths that require authentication
  const protectedPaths = [
    '/workers',
    '/onboarding',
    '/worker',
    '/customer',
  ];
  
  // Check if the current path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  // If it's a protected route and there's no session token, redirect to sign-in
  if (isProtected && !sessionToken) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // For API routes, verify the Firebase token
  if (pathname.startsWith('/api/') && isProtected) {
    // Token verification will be handled in individual API routes
    // using the protectApiRoute utility
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
