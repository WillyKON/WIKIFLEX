"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <div className="auth-card" style={{ margin: 0, maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>Mes informations</h2>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}

      <form action={formAction}>
        <div className="field">
          <label htmlFor="email">Email (non modifiable)</label>
          <input id="email" type="email" value={email} disabled />
        </div>
        <div className="field">
          <label htmlFor="fullName">Nom complet</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={fullName}
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Téléphone (Mobile Money)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            placeholder="+225 ..."
            autoComplete="tel"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
