import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section container" style={{ textAlign: "center", padding: "80px 20px" }}>
      <p className="hero-slogan" style={{ color: "var(--orange)", fontWeight: 700 }}>
        ERREUR 404
      </p>
      <h1 style={{ fontSize: "1.8rem", margin: "0 0 10px" }}>
        Ce document n&apos;existe pas (ou plus).
      </h1>
      <p className="muted" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
        La page recherchée est introuvable. Explorez le catalogue : la
        connaissance technique à portée de main.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btn-secondary">Retour à l&apos;accueil</Link>
        <Link href="/catalogue" className="btn btn-ghost">Voir le catalogue</Link>
      </div>
    </section>
  );
}
