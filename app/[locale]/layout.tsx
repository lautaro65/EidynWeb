import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { enUS, esES } from "@clerk/localizations";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eidyn",
  description: "Virtual Try-On SaaS",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const { userId } = await auth();

  return (
    <ClerkProvider 
      localization={locale === "es" ? esES : enUS}
      appearance={{
        variables: {
          colorPrimary: "var(--primary)",
          colorBackground: "var(--background)",
          colorText: "var(--foreground)",
          colorInputBackground: "var(--background)",
          colorInputText: "var(--foreground)",
          colorDanger: "var(--destructive)",
          colorTextOnPrimaryBackground: "var(--primary-foreground)",
          borderRadius: "0.625rem",
        },
        elements: {
          card: "bg-background border border-border",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-border text-foreground hover:bg-muted/50",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-foreground",
          formFieldInput: "bg-background border-border text-foreground",
          footerActionText: "text-muted-foreground",
          footerActionLink: "text-primary hover:text-primary/90",
          userButtonPopoverCard: "bg-background border border-border shadow-2xl rounded-xl",
          userButtonPopoverActionButton: "hover:bg-muted/50 text-foreground",
          userButtonPopoverActionButtonText: "text-foreground",
        }
      }}
    >
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex min-h-screen flex-col">
                <Navbar initialUserId={userId} />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'rgba(20, 20, 20, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                  },
                }}
              />
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
