import type { Metadata } from "next";
import { GeistSans } from "geist/font";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ToastProvider } from "@/contexts/toast-context";
import { ThemeProvider } from "@/lib/theme";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isClerkConfigured && publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <ConvexClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <html lang="en" dir="ltr">
                <body className={`${GeistSans.variable} antialiased`}>
                  {children}
                </body>
              </html>
            </ToastProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" dir="ltr">
      <body className={`${GeistSans.variable} antialiased`}>
        <ConvexClientProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
