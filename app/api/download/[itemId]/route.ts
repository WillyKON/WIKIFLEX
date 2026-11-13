import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Téléchargement sécurisé : l'utilisateur doit être connecté ET avoir une
// commande PAYÉE contenant ce document. Le fichier est servi via une URL
// signée à durée limitée depuis un bucket Storage PRIVÉ.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: item } = await supabase
    .from("order_items")
    .select(
      "id, product_id, orders!inner(id, user_id, status)",
    )
    .eq("id", itemId)
    .eq("orders.user_id", data.user.id)
    .eq("orders.status", "paid")
    .maybeSingle();

  if (!item) {
    return NextResponse.json(
      { error: "Document non disponible : achat non confirmé." },
      { status: 403 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Téléchargement indisponible : service non configuré." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("file_path, title")
    .eq("id", item.product_id)
    .maybeSingle();

  if (!product?.file_path) {
    return NextResponse.json(
      { error: "Fichier non disponible pour ce document." },
      { status: 404 },
    );
  }

  const { data: signed, error: signedError } = await admin.storage
    .from("documents")
    .createSignedUrl(product.file_path, 300, {
      download: true,
    });

  if (signedError || !signed) {
    console.error(
      "Téléchargement : URL signée impossible",
      signedError?.message,
    );
    return NextResponse.json(
      { error: "Génération du lien de téléchargement impossible." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
