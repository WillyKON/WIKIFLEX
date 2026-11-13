"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Connexion</h1>

        {state.error && <p className="form-error">{state.error}</p>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Adresse email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="form-note">
          Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
