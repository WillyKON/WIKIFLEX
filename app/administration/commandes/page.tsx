import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  transactionId: string | null;
  clientEmail: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
};

export default async function CommandesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Commandes</h1>
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
        <h1 className="section-title">Commandes</h1>
        <div className="empty-state">Accès réservé à l&apos;administrateur.</div>
      </section>
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const [ordersResult, usersResult] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id, cinetpay_transaction_id, amount_fcfa, status, cinetpay_payment_method, created_at, user_id",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    admin.auth.admin.listUsers({ perPage: 500 }),
  ]);

  const ordersError =
    ordersResult.error?.message ?? usersResult.error?.message ?? null;

  const emails = new Map<string, string>();
  for (const u of usersResult.data?.users ?? []) {
    if (u.email) emails.set(u.id, u.email);
  }

  const orders: OrderRow[] = (ordersResult.data ?? []).map((o) => ({
    id: o.id,
    transactionId: o.cinetpay_transaction_id,
    clientEmail: emails.get(o.user_id) ?? "—",
    amount: o.amount_fcfa ?? 0,
    status: o.status,
    paymentMethod: o.cinetpay_payment_method,
    createdAt: o.created_at,
  }));

  return (
    <section className="section container">
      <p style={{ marginTop: 0 }}>
        <Link href="/administration">← Retour à l&apos;administration</Link>
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 className="section-title" style={{ margin: 0 }}>Commandes</h1>
        <a href="/api/admin/orders/export" className="btn btn-secondary btn-small">
          Exporter en CSV
        </a>
      </div>
      <p className="section-sub">{orders.length} commande(s) — 200 plus récentes.</p>

      {ordersError && (
        <div className="notice">
          Lecture impossible : {ordersError}. Vérifiez que
          SUPABASE_SERVICE_ROLE_KEY est définie.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">Aucune commande pour le moment.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Opérateur</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{formatDateFr(o.createdAt)}</td>
                <td><code>{o.transactionId ?? "—"}</code></td>
                <td>{o.clientEmail}</td>
                <td>{o.amount.toLocaleString("fr-FR")} FCFA</td>
                <td>{o.paymentMethod ?? "—"}</td>
                <td className={`status-${o.status}`}>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
