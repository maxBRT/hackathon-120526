import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/role-selection(.*)",
  "/tournaments(.*)",
  "/matches(.*)",
  "/payment/success",
  "/payment/cancel",
  "/api/webhooks(.*)",
]);

// Match `/role-selection`, `/role-selection/`, etc. Exact `"/role-selection"` breaks
// Server Actions when the POST URL has a trailing slash: middleware would redirect
// with a non-RSC response and the client shows "An unexpected response was received".
const isRoleSelection = createRouteMatcher(["/role-selection(.*)"]);

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

        // GET-only: redirecting POST (e.g. saveRole after session.reload()) breaks Server Actions.
        if (
            hasRole &&
            isRoleSelection(req) &&
            (req.method === "GET" || req.method === "HEAD")
        ) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};