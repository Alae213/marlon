import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/pages/providers/convex-client-provider";
import { ToastProvider } from "@/contexts/toast-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { heroFontVariables } from "@/lib/hero-fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marlon",
  description: "Marlon",
  icons: {
    icon: "/Favicon.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = publishableKey && !publishableKey.includes("placeholder");
const fontVariables = {
  "--font-inter": "Inter, -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Helvetica, Arial, sans-serif",
} as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isClerkConfigured && publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <ConvexClientProvider>
          <ToastProvider>
            <html lang="en" dir="ltr">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
<body className={`antialiased ${heroFontVariables}`} style={fontVariables}>
                  {children}
                  <Analytics />
                  <SpeedInsights />
                </body>
              </html>
            </ToastProvider>
          </ConvexClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" dir="ltr">
      <body className={`antialiased ${heroFontVariables}`} style={fontVariables}>
        <ConvexClientProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConvexClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
