import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes require authentication
const isProtectedPageRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
  "/orders(.*)",
  "/store(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect merchant page routes; protected API routes return structured JSON from their handlers.
  if (isProtectedPageRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/api/delivery(.*)",
    "/((?!.*\\..*|_next|api/orders/create|api/checkout-attempts|trpc).*)",
  ],
};
