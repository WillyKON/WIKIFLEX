import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/format";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Mon compte</h1>
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
    .select("full_name, phone, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount_fcfa, created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <section className="section container">
      <h1 className="section-title">Mon compte</h1>
      <p className="section-sub">
        Connecté en tant que {data.user.email}
        {profile?.role === "admin" && " (administrateur)"}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        <ProfileForm
          email={data.user.email ?? ""}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />

        <div>
          <h2>Mes dernières commandes</h2>
          {!orders || orders.length === 0 ? (
            <div className="empty-state">
              Aucune commande pour le moment.{" "}
              <Link href="/catalogue">Découvrir le catalogue</Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDateFr(order.created_at)}</td>
                    <td>{order.amount_fcfa.toLocaleString("fr-FR")} FCFA</td>
                    <td className={`status-${order.status}`}>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ marginTop: 16 }}>
            <Link href="/bibliotheque" className="btn btn-secondary">
              Accéder à ma bibliothèque
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
