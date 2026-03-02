import type { Metadata } from "next";
import { Noto_Sans_Arabic, Noto_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-dj",
  subsets: ["arabic", "latin"],
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
            <body className={`${notoSans.variable} ${notoSansArabic.variable} antialiased`}>
              {children}
            </body>
          </html>
        </ConvexClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoSans.variable} ${notoSansArabic.variable} antialiased`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
