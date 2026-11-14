import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteProductAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdministrationPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Administration</h1>
        <div className="empty-state">
          Supabase n&apos;est pas encore connecté : renseignez vos clés dans
          <code> .env.local </code> puis redémarrez le serveur.
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <section className="section container">
        <h1 className="section-title">Administration</h1>
        <div className="empty-state">
          Accès réservé à l&apos;administrateur de la boutique.
        </div>
      </section>
    );
  }

  let stats = {
    products: 0,
    clients: 0,
    orders: 0,
    paidOrders: 0,
    revenue: 0,
  };
  let dbError: string | null = null;
  let productList: {
    id: string;
    slug: string;
    title: string;
    price_fcfa: number;
    promo_price_fcfa: number | null;
    is_published: boolean;
    file_path: string | null;
  }[] = [];

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const [products, clients, orders, allProducts] = await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("orders").select("status, amount_fcfa"),
      admin
        .from("products")
        .select(
          "id, slug, title, price_fcfa, promo_price_fcfa, is_published, file_path",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    dbError =
      products.error?.message ??
      clients.error?.message ??
      orders.error?.message ??
      allProducts.error?.message ??
      null;

    if (!products.error && !clients.error && !orders.error) {
      const all = orders.data ?? [];
      stats = {
        products: products.count ?? 0,
        clients: clients.count ?? 0,
        orders: all.length,
        paidOrders: all.filter((o) => o.status === "paid").length,
        revenue: all
          .filter((o) => o.status === "paid")
          .reduce((sum, o) => sum + (o.amount_fcfa ?? 0), 0),
      };
    }
    if (!allProducts.error) {
      productList = allProducts.data ?? [];
    }
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Erreur inconnue";
  }

  return (
    <section className="section container">
      <h1 className="section-title">Administration</h1>
      <p className="section-sub">Vue d&apos;ensemble de la boutique.</p>

      {dbError && (
        <div className="notice">
          Lecture des statistiques impossible : {dbError}. Vérifiez que le
          schéma a été exécuté et que SUPABASE_SERVICE_ROLE_KEY est définie.
        </div>
      )}

      <div
        className="grid-cards"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <div className="product-card">
          <span className="badge-category">Documents</span>
          <span className="price" style={{ fontSize: "1.8rem" }}>
            {stats.products}
          </span>
        </div>
        <div className="product-card">
          <span className="badge-category">Clients</span>
          <span className="price" style={{ fontSize: "1.8rem" }}>
            {stats.clients}
          </span>
        </div>
        <div className="product-card">
          <span className="badge-category">Commandes payées</span>
          <span className="price" style={{ fontSize: "1.8rem" }}>
            {stats.paidOrders} / {stats.orders}
          </span>
        </div>
        <div className="product-card">
          <span className="badge-category">Chiffre d&apos;affaires</span>
          <span className="price" style={{ fontSize: "1.8rem" }}>
            {stats.revenue.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/administration/clients" className="btn btn-ghost btn-small">
            Clients
          </Link>
          <Link href="/administration/commandes" className="btn btn-ghost btn-small">
            Commandes
          </Link>
          <Link href="/administration/produits/nouveau" className="btn btn-primary btn-small">
            + Nouveau document
          </Link>
        </div>
      </div>

      {productList.length === 0 ? (
        <div className="empty-state">
          Aucun document pour le moment. Créez votre premier document vendable.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Prix</th>
              <th>Fichier</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/produits/${p.slug}`}>{p.title}</Link>
                </td>
                <td>
                  {p.promo_price_fcfa != null ? (
                    <>
                      <span className="price-old">
                        {p.price_fcfa.toLocaleString("fr-FR")} FCFA
                      </span>{" "}
                      {p.promo_price_fcfa.toLocaleString("fr-FR")} FCFA
                    </>
                  ) : (
                    `${p.price_fcfa.toLocaleString("fr-FR")} FCFA`
                  )}
                </td>
                <td>{p.file_path ? "✅" : "—"}</td>
                <td className={p.is_published ? "status-paid" : "muted"}>
                  {p.is_published ? "Publié" : "Brouillon"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link href={`/administration/produits/${p.id}`}>Modifier</Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="link-button" style={{ color: "#c0392b" }}>
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
