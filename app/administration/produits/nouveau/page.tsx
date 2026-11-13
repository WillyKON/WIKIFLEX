import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Nouveau document</h1>
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
        <h1 className="section-title">Nouveau document</h1>
        <div className="empty-state">Accès réservé à l&apos;administrateur.</div>
      </section>
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <section className="section container">
      <p style={{ marginTop: 0 }}>
        <Link href="/administration">← Retour à l&apos;administration</Link>
      </p>
      <h1 className="section-title">Nouveau document</h1>
      <p className="section-sub">
        Le prix est en FCFA (nombre entier). Le fichier est stocké dans un
        bucket privé : seuls les acheteurs pourront le télécharger.
      </p>
      <ProductForm
        mode="create"
        categories={categories ?? []}
        values={{
          title: "",
          description: "",
          categoryId: "",
          price: 1000,
          promo: null,
          format: "PDF",
          isPublished: false,
        }}
      />
    </section>
  );
}
