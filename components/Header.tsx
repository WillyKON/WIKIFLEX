import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { SearchBar } from "@/components/SearchBar";

export async function Header() {
  let email: string | null = null;
  let isAdmin = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
    if (email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .maybeSingle();
      isAdmin = profile?.role === "admin";
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-name">METRODOC CI</span>
          <span className="brand-tagline">La bibliothèque technique africaine</span>
        </Link>
        <SearchBar />
        <nav className="header-nav">
          <Link href="/catalogue">Catalogue</Link>
          {email ? (
            <>
              <Link href="/compte">Mon compte</Link>
              <Link href="/bibliotheque">Ma bibliothèque</Link>
              {isAdmin && <Link href="/administration">Administration</Link>}
              <form action={signOutAction}>
                <button type="submit" className="link-button">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>
              <Link href="/inscription" className="btn btn-primary btn-small">
                S&apos;inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
