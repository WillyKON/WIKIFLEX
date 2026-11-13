import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cinetpayConfigured, initCinetPayPayment } from "@/lib/cinetpay";

export const dynamic = "force-dynamic";

type PayRequest = { items?: { slug: string }[] };

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Service indisponible : Supabase n'est pas configuré." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour payer." },
      { status: 401 },
    );
  }

  if (!cinetpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Paiement indisponible : CinetPay n'est pas configuré sur le serveur (CINETPAY_API_KEY, CINETPAY_SITE_ID).",
      },
      { status: 503 },
    );
  }

  let body: PayRequest;
  try {
    body = (await request.json()) as PayRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const slugs = [...new Set((body.items ?? []).map((i) => String(i.slug)))];
  if (slugs.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  // Prix TOUJOURS relus côté serveur : jamais confiance au client.
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, title, price_fcfa, promo_price_fcfa")
    .in("slug", slugs)
    .eq("is_published", true);

  if (productsError || !products || products.length !== slugs.length) {
    return NextResponse.json(
      { error: "Un ou plusieurs documents sont introuvables." },
      { status: 400 },
    );
  }

  const lines = products.map((p) => ({
    product_id: p.id as string,
    product_title: p.title as string,
    unit_price_fcfa: (p.promo_price_fcfa ?? p.price_fcfa) as number,
    quantity: 1,
  }));
  const amount = lines.reduce((sum, l) => sum + l.unit_price_fcfa * l.quantity, 0);

  if (amount < 200) {
    return NextResponse.json(
      { error: "Le montant minimum d'une transaction CinetPay est de 200 FCFA." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const admin = createAdminClient();
  const transactionId = `MDCI-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: data.user.id,
      status: "pending",
      amount_fcfa: amount,
      currency: "XOF",
      cinetpay_transaction_id: transactionId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Commande : échec de création", orderError?.message);
    return NextResponse.json(
      { error: "Création de commande impossible." },
      { status: 500 },
    );
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    console.error("Commande : échec des lignes", itemsError.message);
    return NextResponse.json(
      { error: "Création de commande impossible." },
      { status: 500 },
    );
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  ).replace(/\/$/, "");

  try {
    const payment = await initCinetPayPayment({
      transactionId,
      amountFcfa: amount,
      customerName: profile?.full_name || data.user.email || "Client METRODOC",
      customerEmail: data.user.email ?? "",
      description: `METRODOC CI - ${lines.map((l) => l.product_title).join(", ")}`,
      returnUrl: `${appUrl}/bibliotheque`,
      notifyUrl: `${appUrl}/api/webhooks/cinetpay`,
    });

    await admin
      .from("orders")
      .update({ cinetpay_payment_token: payment.paymentToken })
      .eq("id", order.id);

    return NextResponse.json({ paymentUrl: payment.paymentUrl });
  } catch (error) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    console.error(
      "CinetPay : échec d'initialisation",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Initialisation du paiement impossible. Réessayez." },
      { status: 502 },
    );
  }
}
