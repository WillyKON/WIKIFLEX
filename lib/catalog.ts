export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category_slug: string;
  category_name: string;
  price_fcfa: number;
  promo_price_fcfa: number | null;
  format: string;
  preview_url: string | null;
};

export type Category = {
  slug: string;
  name: string;
  description: string | null;
};

export const CATEGORIES: Category[] = [
  { slug: "metrologie", name: "Métrologie", description: "Incertitudes, étalonnage, GUM" },
  { slug: "qhse", name: "QHSE", description: "Hygiène, sécurité, environnement" },
  { slug: "qualite", name: "Qualité", description: "ISO 9001, ISO/IEC 17025, audits" },
  { slug: "analyses", name: "Analyses", description: "Méthodes d'analyse et validation" },
  { slug: "etudes", name: "Études", description: "Études techniques et rapports" },
  { slug: "excel-outils", name: "Excel & outils", description: "Modèles et calculateurs" },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    slug: "calcul-incertitude-gum",
    title: "Calcul d'incertitude GUM",
    description:
      "Classeur Excel complet appliquant le GUM : budget d'incertitude, lois de propagation, facteur d'élargissement k=2 et rapport d'étalonnage prêt à l'emploi.",
    category_slug: "metrologie",
    category_name: "Métrologie",
    price_fcfa: 2500,
    promo_price_fcfa: null,
    format: "Excel",
    preview_url: null,
  },
  {
    id: "demo-2",
    slug: "guide-iso-iec-17025",
    title: "Guide ISO/IEC 17025",
    description:
      "Guide de lecture de la norme ISO/IEC 17025:2017 : exigences de management et techniques, cartographie des écarts et plan de mise en conformité pour un laboratoire.",
    category_slug: "qualite",
    category_name: "Qualité",
    price_fcfa: 2000,
    promo_price_fcfa: null,
    format: "PDF",
    preview_url: null,
  },
  {
    id: "demo-3",
    slug: "modele-audit-interne-9001",
    title: "Modèle d'audit interne ISO 9001",
    description:
      "Trame d'audit interne complète : plan d'audit, checklist par processus, fiche de constat et rapport d'audit conformes à ISO 9001:2015.",
    category_slug: "qualite",
    category_name: "Qualité",
    price_fcfa: 1500,
    promo_price_fcfa: 1000,
    format: "Excel",
    preview_url: null,
  },
  {
    id: "demo-4",
    slug: "cahier-verification-balance",
    title: "Cahier de vérification d'une balance",
    description:
      "Procédure de vérification périodique d'une balance : tests d'excentricité, de répétibilité et d'exactitude, avec feuille de calcul des tolérances.",
    category_slug: "metrologie",
    category_name: "Métrologie",
    price_fcfa: 1000,
    promo_price_fcfa: null,
    format: "PDF",
    preview_url: null,
  },
  {
    id: "demo-5",
    slug: "plan-prevention-chantier",
    title: "Plan de prévention chantier",
    description:
      "Modèle de plan de prévention et de coordination SPS : analyse des risques par lot, mesures de prévention et registre de sécurité.",
    category_slug: "qhse",
    category_name: "QHSE",
    price_fcfa: 3000,
    promo_price_fcfa: null,
    format: "Word",
    preview_url: null,
  },
  {
    id: "demo-6",
    slug: "validation-methodes-analyse",
    title: "Validation des méthodes d'analyse",
    description:
      "Dossier type de validation de méthode : linéarité, limite de détection, limite de quantification, fidélité et justesse, avec exemples chiffrés.",
    category_slug: "analyses",
    category_name: "Analyses",
    price_fcfa: 2500,
    promo_price_fcfa: null,
    format: "PDF",
    preview_url: null,
  },
];

export const FORMATS = ["PDF", "Excel", "Word"];

type CatalogQuery = {
  search?: string;
  category?: string;
  format?: string;
  sort?: "recent" | "price-asc" | "price-desc";
};

export function effectivePrice(p: Product): number {
  return p.promo_price_fcfa ?? p.price_fcfa;
}

function applyFilters(products: Product[], query: CatalogQuery): Product[] {
  let result = [...products];

  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }
  if (query.category) {
    result = result.filter((p) => p.category_slug === query.category);
  }
  if (query.format) {
    result = result.filter((p) => p.format === query.format);
  }
  switch (query.sort) {
    case "price-asc":
      result.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      break;
    case "price-desc":
      result.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      break;
    default:
      break;
  }
  return result;
}

export async function fetchCategories(): Promise<Category[]> {
  const { createClient, isSupabaseConfigured } = await import(
    "@/lib/supabase/server"
  );

  if (!isSupabaseConfigured()) return CATEGORIES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, description")
    .order("name");

  if (error || !data || data.length === 0) return CATEGORIES;
  return data;
}

export async function fetchProducts(query: CatalogQuery): Promise<{
  products: Product[];
  source: "supabase" | "demo";
}> {
  const { createClient, isSupabaseConfigured } = await import(
    "@/lib/supabase/server"
  );

  if (!isSupabaseConfigured()) {
    return { products: applyFilters(DEMO_PRODUCTS, query), source: "demo" };
  }

  const supabase = await createClient();
  let request = supabase
    .from("products")
    .select(
      "id, slug, title, description, price_fcfa, promo_price_fcfa, format, preview_url, categories(slug, name)",
    )
    .eq("is_published", true);

  if (query.search) {
    const sanitized = query.search.replace(/[,()%]/g, " ").trim();
    request = request.or(
      `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`,
    );
  }
  if (query.category) {
    request = request.eq("categories.slug", query.category);
  }
  if (query.format) {
    request = request.eq("format", query.format);
  }
  if (query.sort === "price-asc") {
    request = request.order("price_fcfa", { ascending: true });
  } else if (query.sort === "price-desc") {
    request = request.order("price_fcfa", { ascending: false });
  } else {
    request = request.order("created_at", { ascending: false });
  }

  const { data, error } = await request.limit(60);

  if (error || !data) {
    console.error("Catalogue : échec de lecture Supabase", error?.message);
    return { products: applyFilters(DEMO_PRODUCTS, query), source: "demo" };
  }

  const products: Product[] = data.map((row) => {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category_slug: category?.slug ?? "",
      category_name: category?.name ?? "",
      price_fcfa: row.price_fcfa,
      promo_price_fcfa: row.promo_price_fcfa,
      format: row.format,
      preview_url: row.preview_url,
    };
  });

  return { products: applyFilters(products, query), source: "supabase" };
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  const { createClient, isSupabaseConfigured } = await import(
    "@/lib/supabase/server"
  );

  if (!isSupabaseConfigured()) {
    return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, title, description, price_fcfa, promo_price_fcfa, format, preview_url, categories(slug, name)",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const category = Array.isArray(data.categories)
    ? data.categories[0]
    : data.categories;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    category_slug: category?.slug ?? "",
    category_name: category?.name ?? "",
    price_fcfa: data.price_fcfa,
    promo_price_fcfa: data.promo_price_fcfa,
    format: data.format,
    preview_url: data.preview_url,
  };
}
