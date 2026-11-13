"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminState = { error?: string; success?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Accès réservé à l'administrateur.");
  }
  return data.user;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parsePrice(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return null;
  const n = Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

async function uploadDocument(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  file: File | null,
): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("Fichier trop volumineux (25 Mo maximum).");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${slug}/${Date.now()}-${safeName}`;
  const { error } = await admin.storage
    .from("documents")
    .upload(path, file, { upsert: false });

  if (error) {
    throw new Error("Envoi du fichier impossible : " + error.message);
  }
  return path;
}

export async function createProductAction(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const format = String(formData.get("format") ?? "PDF").trim();
  const price = parsePrice(formData.get("price"));
  const promo = parsePrice(formData.get("promo"));
  const isPublished = formData.get("isPublished") === "on";
  const file = formData.get("file");

  if (!title || price === null) {
    return { error: "Titre et prix (entier, FCFA) sont obligatoires." };
  }
  if (promo !== null && promo >= price) {
    return { error: "Le prix promotionnel doit être inférieur au prix normal." };
  }
  if (!categoryId) {
    return { error: "Choisissez une catégorie." };
  }

  const admin = createAdminClient();

  const { data: category } = await admin
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();

  let slug = slugify(String(formData.get("slug") ?? "") || title);
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  try {
    const filePath = await uploadDocument(
      admin,
      slug,
      file instanceof File ? file : null,
    );

    const { error } = await admin.from("products").insert({
      slug,
      title,
      description,
      category_id: categoryId,
      price_fcfa: price,
      promo_price_fcfa: promo,
      format,
      is_published: isPublished,
      file_path: filePath,
    });

    if (error) return { error: "Création impossible : " + error.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inconnue." };
  }

  revalidatePath("/administration");
  revalidatePath("/catalogue");
  redirect("/administration");
}

export async function updateProductAction(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const format = String(formData.get("format") ?? "PDF").trim();
  const price = parsePrice(formData.get("price"));
  const promo = parsePrice(formData.get("promo"));
  const isPublished = formData.get("isPublished") === "on";
  const file = formData.get("file");

  if (!id || !title || price === null) {
    return { error: "Titre et prix (entier, FCFA) sont obligatoires." };
  }
  if (promo !== null && promo >= price) {
    return { error: "Le prix promotionnel doit être inférieur au prix normal." };
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("products")
    .select("slug, file_path")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { error: "Produit introuvable." };

  try {
    const filePath = await uploadDocument(
      admin,
      current.slug,
      file instanceof File ? file : null,
    );

    const { error } = await admin
      .from("products")
      .update({
        title,
        description,
        category_id: categoryId || null,
        price_fcfa: price,
        promo_price_fcfa: promo,
        format,
        is_published: isPublished,
        ...(filePath ? { file_path: filePath } : {}),
      })
      .eq("id", id);

    if (error) return { error: "Mise à jour impossible : " + error.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inconnue." };
  }

  revalidatePath("/administration");
  revalidatePath("/catalogue");
  redirect("/administration");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const admin = createAdminClient();

  // On refuse la suppression si le produit figure dans des commandes.
  const { data: item } = await admin
    .from("order_items")
    .select("id")
    .eq("product_id", id)
    .limit(1)
    .maybeSingle();

  if (item) {
    // Historique de ventes : on dépublie au lieu de supprimer.
    await admin.from("products").update({ is_published: false }).eq("id", id);
  } else {
    await admin.from("products").delete().eq("id", id);
  }

  revalidatePath("/administration");
  revalidatePath("/catalogue");
  redirect("/administration");
}
