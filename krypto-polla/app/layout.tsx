import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Krypto-Polla Natillera · Mundial 2026",
  description:
    "Polla futbolera de la familia Natillera para el Mundial 2026. Pronostica, suma puntos y compite por el título.",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
