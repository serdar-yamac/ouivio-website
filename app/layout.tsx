import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ouivio – Hochzeitsplanung neu gedacht",
  description: "Plant, vergleicht und bucht eure Hochzeit zentral mit Ouivio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
