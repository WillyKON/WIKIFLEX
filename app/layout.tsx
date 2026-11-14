import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "METRODOC CI — La bibliothèque technique africaine",
  description:
    "Documents, modèles professionnels et outils pratiques en métrologie, qualité, QHSE et analyses scientifiques. Prix en FCFA, paiement Mobile Money, téléchargement numérique.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <CartProvider>
          <Suspense fallback={<div className="site-header" />}>
            <Header />
          </Suspense>
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
