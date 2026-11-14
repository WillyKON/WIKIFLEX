import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCinetPayTransaction } from "@/lib/cinetpay";

export type ReconciliationResult = {
  status: "paid" | "pending" | "failed" | "unknown";
  message: string;
};

// Vérification au retour du client depuis CinetPay.
// Complète le webhook : si la notification serveur-à-serveur n'est pas
// encore arrivée, on interroge CinetPay et on met à jour la commande.
// Idempotent : une commande déjà "paid" n'est jamais retraitée.
export async function reconcileOrder(
  transactionId: string,
  userId: string,
): Promise<ReconciliationResult> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, status, amount_fcfa, user_id")
    .eq("cinetpay_transaction_id", transactionId)
    .maybeSingle();

  if (!order || order.user_id !== userId) {
    return { status: "unknown", message: "Commande introuvable." };
  }

  if (order.status === "paid") {
    return { status: "paid", message: "Paiement confirmé." };
  }
  if (order.status !== "pending") {
    return { status: "failed", message: "Le paiement n'a pas abouti." };
  }

  let check;
  try {
    check = await verifyCinetPayTransaction(transactionId);
  } catch {
    return {
      status: "pending",
      message:
        "Paiement en cours de vérification : votre bibliothèque sera mise à jour d'un instant à l'autre.",
    };
  }

  if (check.status === "ACCEPTED") {
    if (check.amount !== order.amount_fcfa) {
      console.error(
        `Retour : écart de montant pour ${transactionId} (attendu ${order.amount_fcfa}, payé ${check.amount})`,
      );
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
      return { status: "failed", message: "Écart de montant détecté : contactez le support." };
    }
    await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        cinetpay_payment_method: check.paymentMethod,
      })
      .eq("id", order.id);
    return { status: "paid", message: "Paiement confirmé, merci !" };
  }

  if (check.status === "REFUSED") {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { status: "failed", message: "Le paiement a été refusé." };
  }

  return {
    status: "pending",
    message: "Paiement en attente de confirmation par l'opérateur Mobile Money.",
  };
}
