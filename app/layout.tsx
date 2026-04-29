import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/pages/providers/convex-client-provider";
import { ToastProvider } from "@/contexts/toast-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

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
            <html lang="en" dir="ltr" className={`${inter.variable} ${nunito.variable}`}>
              {process.env.NODE_ENV === "development" && (
                <Script
                  src="//unpkg.com/react-grab/dist/index.global.js"
                  crossOrigin="anonymous"
                  strategy="lazyOnload"
                />
              )}
              {process.env.NODE_ENV === "development" && (
                <Script
                  src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
                  strategy="lazyOnload"
                />
              )}
              <body className="antialiased">
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
    <html lang="en" dir="ltr" className={`${inter.variable} ${nunito.variable}`}>
      <body className="antialiased">
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
