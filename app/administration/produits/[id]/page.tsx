import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Modifier le document</h1>
        <div className="empty-state">
          Supabase n&apos;est pas encore connecté : renseignez vos clés dans
          <code> .env.local </code> puis redémarrez le serveur.
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <section className="section container">
        <h1 className="section-title">Modifier le document</h1>
        <div className="empty-state">Accès réservé à l&apos;administrateur.</div>
      </section>
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select(
        "id, slug, title, description, category_id, price_fcfa, promo_price_fcfa, format, is_published, file_path",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <section className="section container">
      <p style={{ marginTop: 0 }}>
        <Link href="/administration">← Retour à l&apos;administration</Link>
        {" · "}
        <Link href={`/produits/${product.slug}`}>Voir la fiche publique</Link>
      </p>
      <h1 className="section-title">Modifier : {product.title}</h1>
      <p className="section-sub">Slug : <code>{product.slug}</code></p>
      <ProductForm
        mode="edit"
        categories={categories ?? []}
        values={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          categoryId: product.category_id ?? "",
          price: product.price_fcfa,
          promo: product.promo_price_fcfa,
          format: product.format,
          isPublished: product.is_published,
          hasFile: Boolean(product.file_path),
        }}
      />
    </section>
  );
}
