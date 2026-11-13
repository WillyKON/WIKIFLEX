import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

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

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const [products, clients, orders] = await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("orders").select("status, amount_fcfa"),
    ]);

    dbError =
      products.error?.message ??
      clients.error?.message ??
      orders.error?.message ??
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

      <div className="notice" style={{ marginTop: 24 }}>
        Prochaine étape (Phase 2, suite) : formulaire de création / modification
        des produits, liste détaillée des clients et export des commandes.
      </div>
    </section>
  );
}
