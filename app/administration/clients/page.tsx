import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  fullName: string;
  email: string;
  registeredAt: string;
  paidOrders: number;
  totalSpent: number;
};

export default async function ClientsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Clients</h1>
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
        <h1 className="section-title">Clients</h1>
        <div className="empty-state">Accès réservé à l&apos;administrateur.</div>
      </section>
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const [profilesResult, ordersResult, usersResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("orders").select("user_id, status, amount_fcfa"),
    admin.auth.admin.listUsers({ perPage: 500 }),
  ]);

  const clientsError =
    profilesResult.error?.message ??
    ordersResult.error?.message ??
    usersResult.error?.message ??
    null;

  const clients: ClientRow[] = [];
  if (!clientsError) {
    const emails = new Map<string, string>();
    for (const u of usersResult.data?.users ?? []) {
      if (u.email) emails.set(u.id, u.email);
    }

    const orders = ordersResult.data ?? [];
    const byUser = new Map<string, { paid: number; total: number }>();
    for (const o of orders) {
      if (o.status !== "paid") continue;
      const entry = byUser.get(o.user_id) ?? { paid: 0, total: 0 };
      entry.paid += 1;
      entry.total += o.amount_fcfa ?? 0;
      byUser.set(o.user_id, entry);
    }

    for (const p of profilesResult.data ?? []) {
      const stats = byUser.get(p.id) ?? { paid: 0, total: 0 };
      clients.push({
        id: p.id,
        fullName: p.full_name || "(sans nom)",
        email: emails.get(p.id) ?? "—",
        registeredAt: p.created_at,
        paidOrders: stats.paid,
        totalSpent: stats.total,
      });
    }
  }

  return (
    <section className="section container">
      <p style={{ marginTop: 0 }}>
        <Link href="/administration">← Retour à l&apos;administration</Link>
      </p>
      <h1 className="section-title">Clients</h1>
      <p className="section-sub">{clients.length} compte(s) enregistré(s).</p>

      {clientsError && (
        <div className="notice">
          Lecture impossible : {clientsError}. Vérifiez que
          SUPABASE_SERVICE_ROLE_KEY est définie.
        </div>
      )}

      {clients.length === 0 ? (
        <div className="empty-state">Aucun client pour le moment.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Inscription</th>
              <th>Commandes payées</th>
              <th>Total dépensé</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.fullName}</td>
                <td>{c.email}</td>
                <td>{formatDateFr(c.registeredAt)}</td>
                <td>{c.paidOrders}</td>
                <td>{c.totalSpent.toLocaleString("fr-FR")} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
