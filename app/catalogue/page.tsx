import Link from "next/link";
import { fetchCategories, fetchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

const FORMATS = ["PDF", "Excel", "Word"];

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = first(params.q);
  const category = first(params.categorie);
  const format = first(params.format);
  const sort = first(params.tri);

  const [categories, { products, source }] = await Promise.all([
    fetchCategories(),
    fetchProducts({
      search,
      category,
      format,
      sort: sort === "price-asc" || sort === "price-desc" ? sort : "recent",
    }),
  ]);

  function href(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q: search,
      categorie: category,
      format,
      tri: sort,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return `/catalogue${qs ? `?${qs}` : ""}`;
  }

  return (
    <section className="section container">
      <h1 className="section-title">Catalogue</h1>
      <p className="section-sub">
        {source === "demo"
          ? "Mode démonstration : catalogue illustratif tant que Supabase n'est pas connecté."
          : `${products.length} document(s) disponible(s).`}
      </p>

      <div className="filters">
        <Link
          href={href({ categorie: undefined })}
          className={`chip ${!category ? "active" : ""}`}
        >
          Toutes
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={href({ categorie: c.slug })}
            className={`chip ${category === c.slug ? "active" : ""}`}
          >
            {c.name}
          </Link>
        ))}

        <form
          action="/catalogue"
          method="get"
          style={{ display: "flex", gap: 10, marginLeft: "auto" }}
        >
          {search && <input type="hidden" name="q" value={search} />}
          {category && <input type="hidden" name="categorie" value={category} />}
          <select name="format" defaultValue={format ?? ""} aria-label="Format">
            <option value="">Tous formats</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select name="tri" defaultValue={sort ?? "recent"} aria-label="Trier">
            <option value="recent">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
          <button type="submit" className="btn btn-secondary btn-small">
            Appliquer
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          Aucun document ne correspond à votre recherche.{" "}
          <Link href="/catalogue">Réinitialiser les filtres</Link>
        </div>
      ) : (
        <div className="grid-cards">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
