import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCinetPayTransaction } from "@/lib/cinetpay";

export const dynamic = "force-dynamic";

// Notification serveur-à-serveur CinetPay (form-urlencoded : cpm_trans_id).
// Principe : ne JAMAIS faire confiance au contenu de la notification.
// On relit le statut réel auprès de CinetPay avant de valider la commande.
export async function POST(request: Request) {
  let transactionId = "";

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { cpm_trans_id?: string };
      transactionId = body.cpm_trans_id ?? "";
    } else {
      const form = await request.formData();
      transactionId = String(form.get("cpm_trans_id") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "Requête illisible" }, { status: 400 });
  }

  if (!transactionId) {
    return NextResponse.json({ error: "cpm_trans_id manquant" }, { status: 400 });
  }

  if (
    !process.env.CINETPAY_API_KEY ||
    !process.env.CINETPAY_SITE_ID ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ error: "Service non configuré" }, { status: 503 });
  }

  try {
    const check = await verifyCinetPayTransaction(transactionId);
    const admin = createAdminClient();

    const { data: order } = await admin
      .from("orders")
      .select("id, status, amount_fcfa")
      .eq("cinetpay_transaction_id", transactionId)
      .maybeSingle();

    if (!order) {
      console.error("Webhook : commande inconnue", transactionId);
      return NextResponse.json({ received: true, ignored: "unknown_order" });
    }

    // Anti-doublon : seule une commande "pending" peut évoluer.
    if (order.status !== "pending") {
      return NextResponse.json({ received: true, ignored: "already_processed" });
    }

    // Vérification du montant : le montant payé doit correspondre exactement.
    if (check.status === "ACCEPTED" && check.amount !== order.amount_fcfa) {
      console.error(
        `Webhook : écart de montant pour ${transactionId} (attendu ${order.amount_fcfa}, payé ${check.amount})`,
      );
      await admin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      return NextResponse.json({ received: true, ignored: "amount_mismatch" });
    }

    if (check.status === "ACCEPTED") {
      const { error: updateError } = await admin
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          cinetpay_payment_method: check.paymentMethod,
        })
        .eq("id", order.id);
      if (updateError) {
        console.error("Webhook : mise à jour impossible", updateError.message);
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }
    } else if (check.status === "REFUSED") {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Webhook : vérification CinetPay impossible",
      error instanceof Error ? error.message : error,
    );
    // 500 : CinetPay retentera la notification.
    return NextResponse.json({ error: "verification_failed" }, { status: 500 });
  }
}
