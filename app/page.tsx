import Link from "next/link";
import { fetchCategories, fetchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, { products, source }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ sort: "recent" }),
  ]);

  const published = products.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-slogan">LA BIBLIOTHÈQUE TECHNIQUE AFRICAINE</p>
          <h1>La connaissance technique à portée de main.</h1>
          <p className="hero-sub">
            Documents, modèles professionnels et outils pratiques en métrologie,
            qualité, QHSE et analyses scientifiques.
          </p>
          <div className="hero-badges">
            <span className="hero-badge">Prix en FCFA</span>
            <span className="hero-badge">Mobile Money</span>
            <span className="hero-badge">Téléchargement numérique</span>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Nos catégories</h2>
        <p className="section-sub">
          Des documents opérationnels pour laboratoires, entreprises et
          professionnels indépendants.
        </p>
        <div className="category-grid">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogue?categorie=${c.slug}`}
              className="category-card"
            >
              <strong>{c.name}</strong>
              <span>{c.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Sélection de documents</h2>
        <p className="section-sub">
          {source === "demo"
            ? "Produits illustratifs (mode démonstration — Supabase non connecté)."
            : "Les derniers documents publiés sur la boutique."}
        </p>
        {published.length === 0 ? (
          <div className="empty-state">
            Aucun document publié pour le moment. Revenez bientôt !
          </div>
        ) : (
          <div className="grid-cards">
            {published.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        <p style={{ marginTop: 24 }}>
          <Link href="/catalogue" className="btn btn-ghost">
            Voir tout le catalogue →
          </Link>
        </p>
      </section>
    </>
  );
}
