import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/format";
import { reconcileOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type LibraryItem = {
  itemId: string;
  title: string;
  purchasedAt: string;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const transactionParam = params.transaction;
  const transactionId = Array.isArray(transactionParam)
    ? transactionParam[0]
    : transactionParam;

  if (!isSupabaseConfigured()) {
    return (
      <section className="section container">
        <h1 className="section-title">Ma bibliothèque</h1>
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
    return (
      <section className="section container">
        <h1 className="section-title">Ma bibliothèque</h1>
        <div className="empty-state">
          Connectez-vous pour retrouver vos documents achetés.{" "}
          <a href="/connexion">Se connecter</a>
        </div>
      </section>
    );
  }

  let paymentNotice: { kind: "paid" | "pending" | "failed"; text: string } | null = null;

  if (transactionId) {
    try {
      const result = await reconcileOrder(transactionId, data.user.id);
      if (result.status !== "unknown") {
        paymentNotice = { kind: result.status, text: result.message };
      }
    } catch {
      paymentNotice = {
        kind: "pending",
        text:
          "Paiement en cours de vérification : votre bibliothèque sera mise à jour d'un instant à l'autre.",
      };
    }
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, order_items(id, product_id, product_title, unit_price_fcfa)",
    )
    .eq("user_id", data.user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Bibliothèque : échec de lecture", error.message);
  }

  const items: LibraryItem[] = (orders ?? []).flatMap((order) =>
    (order.order_items ?? []).map((item) => ({
      itemId: item.id,
      title: item.product_title,
      purchasedAt: order.created_at,
    })),
  );

  return (
    <section className="section container">
      <h1 className="section-title">Ma bibliothèque</h1>
      <p className="section-sub">
        Vos documents achetés, disponibles en téléchargement illimité.
      </p>

      {paymentNotice && (
        <div
          className={
            paymentNotice.kind === "paid"
              ? "form-success"
              : paymentNotice.kind === "failed"
                ? "form-error"
                : "notice"
          }
        >
          {paymentNotice.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          Vous n&apos;avez pas encore de document. Les documents apparaissent ici
          dès que votre paiement est confirmé.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Acheté le</th>
              <th>Télécharger</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemId}>
                <td>{item.title}</td>
                <td>{formatDateFr(item.purchasedAt)}</td>
                <td>
                  <a
                    href={`/api/download/${item.itemId}`}
                    className="btn btn-secondary btn-small"
                  >
                    Télécharger
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
