import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "MultiSuggest",
  description: "Najdi kam jít s MultiSport kartou",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MultiSuggest",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to prevent theme FOUC - runs before React hydration
  const themeScript = `
    (function() {
      try {
        var stored = JSON.parse(localStorage.getItem('multisuggest-theme') || '{}');
        var theme = stored.state && stored.state.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'system' || !theme) {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch(e) {}
    })();
  `;

  return (
    <html
      lang="cs"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex h-full bg-background text-foreground">
        <Providers>
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-1 flex-col min-h-full">
            <main className="flex-1 pb-20 md:pb-0 pt-[env(safe-area-inset-top)]">
              {children}
            </main>

            {/* Mobile bottom nav (hidden on desktop) */}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
