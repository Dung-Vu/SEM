import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
    title: "SEM — Self English Mastery",
    description:
        "Hành trình chinh phục tiếng Anh cá nhân. Solo Player · Long-term Campaign · Gamified.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "SEM",
    },
    icons: {
        icon: "/icons/icon-192.png",
        apple: "/icons/icon-192.png",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#07080D",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className="dark" suppressHydrationWarning>
            <head>
                {/* Preconnect for performance */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />

                {/*
                  Fonts:
                  - Outfit (700,800) → display/headings — hỗ trợ đầy đủ Latin Extended + tiếng Việt
                  - Inter (400,500,600) → body text — clean, readable mọi charset
                  - JetBrains Mono (400,600) → numbers, code, data
                */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
                    rel="stylesheet"
                    fetchPriority="high"
                />

                {/* PWA */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />
                <meta name="theme-color" content="#07080D" />
            </head>
            <body suppressHydrationWarning>
                {/* Prevent FOUC: apply theme before first paint */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var t=localStorage.getItem('eq-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})()`,
                    }}
                />
                {/* iOS viewport height fix: --app-height tracks real viewport */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){function s(){var h=window.visualViewport?window.visualViewport.height:window.innerHeight;document.documentElement.style.setProperty('--app-height',h+'px')}s();window.visualViewport&&window.visualViewport.addEventListener('resize',s);window.addEventListener('resize',s)})()`,
                    }}
                />
                <ThemeProvider>
                    <AppShell>{children}</AppShell>
                </ThemeProvider>

                {/* Service Worker */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
                    }}
                />
            </body>
        </html>
    );
}
