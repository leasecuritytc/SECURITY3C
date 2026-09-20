import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Security3C | Segurança eletrônica e soluções inteligentes",
    template: "%s | Security3C",
  },
  description: "Instalação e manutenção de segurança eletrônica, automação residencial, controle de acesso, CFTV e soluções inteligentes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
