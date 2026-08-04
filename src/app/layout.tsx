import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vuca Docs",
    template: "%s · Vuca Docs",
  },
  description: "Base de conhecimento interna da Vuca.",
  robots: { index: false, follow: false },
};

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
