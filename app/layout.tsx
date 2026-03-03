import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ToastProvider } from "@/contexts/toast-context";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marlon",
  description: "Marlon",
  icons: {
    icon: "/Favicon.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = publishableKey && !publishableKey.includes("placeholder");

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
              <body className={`${dmSans.variable} antialiased`}>
                {children}
              </body>
            </html>
          </ToastProvider>
        </ConvexClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" dir="ltr">
      <body className={`${dmSans.variable} antialiased`}>
        <ConvexClientProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
