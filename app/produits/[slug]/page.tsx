import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { effectivePrice, fetchProductBySlug } from "@/lib/catalog";
import { formatFcfa } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return {
    title: product
      ? `${product.title} — METRODOC CI`
      : "Document introuvable — METRODOC CI",
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) notFound();

  const price = effectivePrice(product);
  const hasPromo = product.promo_price_fcfa != null;

  return (
    <section className="section container">
      <p style={{ marginTop: 0 }}>
        <Link href="/catalogue">← Retour au catalogue</Link>
      </p>

      <div className="product-hero">
        <div>
          <div className="product-card-top">
            <span className="badge-category">{product.category_name}</span>
            <span className="badge-format">{product.format}</span>
          </div>
          <h1 style={{ margin: "10px 0" }}>{product.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>{product.description}</p>

          <div
            className="empty-state"
            style={{ textAlign: "left", marginTop: 24 }}
          >
            <strong>Aperçu du document</strong>
            <p>
              {product.preview_url ? (
                <a href={product.preview_url} target="_blank" rel="noopener noreferrer">
                  Consulter l&apos;extrait gratuit
                </a>
              ) : (
                "Un extrait gratuit sera disponible prochainement pour ce document."
              )}
            </p>
          </div>
        </div>

        <aside className="product-panel">
          <div className="price-block" style={{ marginBottom: 12 }}>
            {hasPromo && (
              <span className="price-old">{formatFcfa(product.price_fcfa)}</span>
            )}
            <span className="price" style={{ fontSize: "1.5rem" }}>
              {formatFcfa(price)}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Format : {product.format} · Téléchargement numérique immédiat après
            paiement.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <AddToCartButton
              item={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                price_fcfa: price,
                format: product.format,
              }}
            />
            <Link href="/panier" className="btn btn-ghost">
              Voir le panier
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
