import Link from "next/link";
import { effectivePrice, type Product } from "@/lib/catalog";
import { formatFcfa } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  const price = effectivePrice(product);
  const hasPromo = product.promo_price_fcfa != null;

  return (
    <article className="product-card">
      <div className="product-card-top">
        <span className="badge-category">{product.category_name}</span>
        <span className="badge-format">{product.format}</span>
      </div>
      <Link href={`/produits/${product.slug}`} className="product-card-title">
        {product.title}
      </Link>
      <p className="product-card-desc">{product.description}</p>
      <div className="product-card-footer">
        <div className="price-block">
          {hasPromo && (
            <span className="price-old">{formatFcfa(product.price_fcfa)}</span>
          )}
          <span className="price">{formatFcfa(price)}</span>
        </div>
        <AddToCartButton
          item={{
            id: product.id,
            slug: product.slug,
            title: product.title,
            price_fcfa: price,
            format: product.format,
          }}
        />
      </div>
    </article>
  );
}
