import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marlon - أنشئ متجرك الإلكتروني",
  description: "منصة التجارة الإلكترونية للشركات الجزائرية",
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
          <html lang="ar" dir="rtl">
            <body className={`${dmSans.variable} antialiased`}>
              {children}
            </body>
          </html>
        </ConvexClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <html lang="ar" dir="rtl">
      <body className={`${dmSans.variable} antialiased`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
