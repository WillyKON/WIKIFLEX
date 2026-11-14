import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return new Response("Service indisponible : Supabase n'est pas configuré.", {
      status: 503,
    });
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
    return new Response("Accès réservé à l'administrateur.", { status: 403 });
  }

  const admin = createAdminClient();
  const [ordersResult, usersResult] = await Promise.all([
    admin
      .from("orders")
      .select(
        "cinetpay_transaction_id, amount_fcfa, status, cinetpay_payment_method, created_at, user_id",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (ordersResult.error || usersResult.error) {
    return new Response("Export impossible.", { status: 500 });
  }

  const emails = new Map<string, string>();
  for (const u of usersResult.data?.users ?? []) {
    if (u.email) emails.set(u.id, u.email);
  }

  const header = "date;transaction;client;montant_fcfa;statut;operateur";
  const lines = (ordersResult.data ?? []).map((o) =>
    [
      o.created_at,
      o.cinetpay_transaction_id ?? "",
      emails.get(o.user_id) ?? "",
      String(o.amount_fcfa ?? 0),
      o.status,
      o.cinetpay_payment_method ?? "",
    ]
      .map(csvEscape)
      .join(";"),
  );

  const csv = "\uFEFF" + [header, ...lines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metrodoc-commandes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
