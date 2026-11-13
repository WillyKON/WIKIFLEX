"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatFcfa } from "@/lib/format";

export default function PanierPage() {
  const { items, total, remove, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function payer() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug })),
        }),
      });
      const data = (await response.json()) as { paymentUrl?: string; error?: string };

      if (!response.ok || !data.paymentUrl) {
        if (response.status === 401) {
          router.push("/connexion?next=/panier");
          return;
        }
        setError(data.error ?? "Le paiement n'a pas pu être initialisé.");
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError("Erreur réseau : réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section container">
      <h1 className="section-title">Panier</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          Votre panier est vide.{" "}
          <Link href="/catalogue">Parcourir le catalogue</Link>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Format</th>
                <th>Prix</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/produits/${item.slug}`}>{item.title}</Link>
                  </td>
                  <td>{item.format}</td>
                  <td>{formatFcfa(item.price_fcfa)}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      style={{ color: "#c0392b" }}
                      onClick={() => remove(item.id)}
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="product-panel" style={{ maxWidth: 380, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Total</strong>
              <strong>{formatFcfa(total)}</strong>
            </div>
            {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 14 }}
              onClick={payer}
              disabled={loading}
            >
              {loading ? "Redirection..." : "Payer par Mobile Money"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 10 }}
              onClick={clear}
            >
              Vider le panier
            </button>
            <p className="form-note">
              Paiement sécurisé via CinetPay (Orange Money, MTN MoMo, Moov Money,
              Wave). Vous devez être connecté pour payer.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
