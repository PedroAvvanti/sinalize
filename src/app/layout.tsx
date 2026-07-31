import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sinalize",
  description:
    "Conexão entre pessoas surdas e intérpretes de Libras por videochamadas agendadas.",
  applicationName: "Sinalize",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sinalize",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0878ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0878ff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme="light" lang="pt-BR" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          Ir para o conteúdo principal
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
