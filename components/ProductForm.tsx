"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  type AdminState,
} from "@/app/actions/admin";

const initialState: AdminState = {};

export type ProductFormValues = {
  id?: string;
  title: string;
  slug?: string;
  description: string;
  categoryId: string;
  price: number;
  promo: number | null;
  format: string;
  isPublished: boolean;
  hasFile?: boolean;
};

const FORMATS = ["PDF", "Excel", "Word"];

export function ProductForm({
  mode,
  categories,
  values,
}: {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  values: ProductFormValues;
}) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} style={{ maxWidth: 640 }}>
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}

      <div className="field">
        <label htmlFor="title">Titre du document</label>
        <input id="title" name="title" type="text" defaultValue={values.title} required />
      </div>

      {mode === "create" && (
        <div className="field">
          <label htmlFor="slug">Identifiant URL (optionnel, généré depuis le titre)</label>
          <input id="slug" name="slug" type="text" defaultValue={values.slug} placeholder="mon-document" />
        </div>
      )}

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          rows={4}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit", fontSize: "0.95rem" }}
        />
      </div>

      <div className="field">
        <label htmlFor="categoryId">Catégorie</label>
        <select id="categoryId" name="categoryId" defaultValue={values.categoryId} required>
          <option value="">— Choisir —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label htmlFor="price">Prix (FCFA)</label>
          <input id="price" name="price" type="number" min={0} step={100} defaultValue={values.price} required />
        </div>
        <div className="field">
          <label htmlFor="promo">Prix promo (optionnel)</label>
          <input id="promo" name="promo" type="number" min={0} step={100} defaultValue={values.promo ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="format">Format</label>
          <select id="format" name="format" defaultValue={values.format}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="file">
          {values.hasFile
            ? "Remplacer le fichier vendu (optionnel)"
            : "Fichier vendu (PDF / Excel / Word, 25 Mo max)"}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.xlsx,.xls,.doc,.docx"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {values.hasFile && fileName === null && (
          <p className="form-note">Un fichier est déjà associé à ce document.</p>
        )}
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" name="isPublished" defaultChecked={values.isPublished} />
          Publié dans la boutique
        </label>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement..." : mode === "create" ? "Créer le document" : "Enregistrer"}
        </button>
        <Link href="/administration" className="btn btn-ghost">Annuler</Link>
      </div>
    </form>
  );
}
