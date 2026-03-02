import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/store(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect dashboard and store routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Protect all routes except static files and API routes
  matcher: ["/((?!.*\\..*|_next|api|trpc).*)"],
};
