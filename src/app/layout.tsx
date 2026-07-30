import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sinalize",
  description:
    "Conexão entre pessoas surdas e intérpretes de Libras por videochamadas agendadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme="light" lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
