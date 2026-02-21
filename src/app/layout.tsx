import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "ArchonPro - Business Suite Dashboard",
  description: "ArchonPro is een krachtige business suite voor het beheren van bedrijven, contacten, deals, offertes en projecten met AI-integratie.",
  keywords: ["ArchonPro", "Business Suite", "CRM", "Project Management", "Deals", "Offertes", "AI Assistant", "Dashboard"],
  authors: [{ name: "ArchonPro Team" }],
  metadataBase: new URL("https://archonpro.app"),
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ArchonPro - Business Suite Dashboard",
    description: "Krachtige business suite voor bedrijfsbeheer met AI-integratie",
    url: "https://archonpro.app",
    siteName: "ArchonPro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchonPro - Business Suite Dashboard",
    description: "Krachtige business suite voor bedrijfsbeheer met AI-integratie",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl-NL" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <a href="#main-content" className="skip-to-content">Ga naar inhoud</a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <main id="main-content" tabIndex={-1} className="focus:outline-none">
              {children}
            </main>
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
