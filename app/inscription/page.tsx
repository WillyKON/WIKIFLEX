"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function InscriptionPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Créer un compte</h1>

        {state.error && <p className="form-error">{state.error}</p>}
        {state.success && <p className="form-success">{state.success}</p>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="fullName">Nom complet</label>
            <input id="fullName" name="fullName" type="text" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Adresse email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe (8 caractères minimum)</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={pending}>
            {pending ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="form-note">
          Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
