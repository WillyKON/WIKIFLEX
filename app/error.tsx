"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section container" style={{ textAlign: "center", padding: "80px 20px" }}>
      <p className="hero-slogan" style={{ color: "var(--orange)", fontWeight: 700 }}>
        OUPS, UNE ERREUR
      </p>
      <h1 style={{ fontSize: "1.8rem", margin: "0 0 10px" }}>
        Une erreur inattendue s&apos;est produite.
      </h1>
      <p className="muted" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
        Le problème a été enregistré. Réessayez dans un instant ; si cela persiste,
        contactez-nous sur WhatsApp.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={reset} className="btn btn-primary">
          Réessayer
        </button>
        <Link href="/" className="btn btn-ghost">
          Retour à l&apos;accueil
        </Link>
      </div>
    </section>
  );
}
