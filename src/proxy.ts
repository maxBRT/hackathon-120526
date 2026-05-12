import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/role-selection(.*)",
  "/tournaments(.*)",
  "/api/webhooks(.*)",
]);

const isRoleSelection = createRouteMatcher(["/role-selection"])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const hasRole = !!sessionClaims?.metadata?.role;
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    if (userId) {
        if (!hasRole && !isRoleSelection(req)) {
            return NextResponse.redirect(new URL('/role-selection', req.url));
        }

        if (hasRole && isRoleSelection(req)) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};