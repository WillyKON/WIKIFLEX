import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="brand-name">METRODOC CI</p>
          <p className="muted">
            La connaissance technique à portée de main. Documents, modèles
            professionnels et outils pratiques en métrologie, qualité et QHSE.
          </p>
        </div>
        <div>
          <p className="footer-title">Boutique</p>
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/panier">Panier</Link>
          <Link href="/bibliotheque">Ma bibliothèque</Link>
        </div>
        <div>
          <p className="footer-title">Assistance</p>
          <a href="https://wa.me/2250000000000" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a href="mailto:contact@metrodoc.ci">contact@metrodoc.ci</a>
        </div>
        <div>
          <p className="footer-title">Paiement</p>
          <p className="muted">Mobile Money via CinetPay · Prix en FCFA · Téléchargement numérique</p>
        </div>
      </div>
      <p className="footer-legal">
        © {new Date().getFullYear()} METRODOC CI — Abidjan, Côte d&apos;Ivoire
      </p>
    </footer>
  );
}
