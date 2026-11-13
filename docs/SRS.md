# SRS — Spécifications des exigences logicielles (METRODOC CI)

Version 0.2 — Phase 2 (Étape 2 : Supabase + Auth + catalogue dynamique)

## 1. Objet
Boutique en ligne à vendeur unique de documents techniques (métrologie, qualité, QHSE, analyses), marché ivoirien, paiement Mobile Money en FCFA.

## 2. Acteurs
- **Visiteur** : consulte le catalogue, ajoute au panier.
- **Client** : compte requis pour payer ; accède à sa bibliothèque.
- **Administrateur** (vendeur unique) : gère produits, consulte ventes et CA.

## 3. Exigences fonctionnelles
| ID | Exigence | État |
|----|----------|------|
| RF-01 | Accueil : présentation, catégories, sélection | Livré |
| RF-02 | Catalogue : recherche plein texte, filtres catégorie/format, tri prix | Livré |
| RF-03 | Fiche produit : description, format, prix, promo, aperçu | Livré |
| RF-04 | Panier : ajout, retrait, total, persistance locale | Livré |
| RF-05 | Comptes : inscription (email + mot de passe), connexion, profil | Livré |
| RF-06 | Paiement CinetPay : commande serveur, initialisation, webhook | Codé, à tester en sandbox |
| RF-07 | Bibliothèque : documents des commandes payées | Livré (nécessite paiements réels) |
| RF-08 | Téléchargement sécurisé : droit vérifié, URL signée 5 min | Codé, à tester avec fichiers réels |
| RF-09 | Administration : statistiques (produits, clients, ventes, CA) | Livré |
| RF-10 | Administration : CRUD produits, liste clients | Non livré |
| RF-11 | Assistance : contact email + WhatsApp | Livré (footer) |

## 4. Exigences non fonctionnelles
- **Sécurité** : RLS PostgreSQL, prix calculés serveur, webhook re-vérifié, secrets hors code.
- **Performance** : pages dynamiques légères, index SQL sur produits/commandes.
- **Devise** : FCFA (XOF), entiers sans décimales, minimum transaction 200 FCFA.
- **Langue** : interface intégralement en français.
- **Accessibilité** : labels de formulaires, contrastes suffisants, responsive mobile-first.

## 5. Contraintes
- Vendeur unique (marketplace en évolution ultérieure).
- Hébergement : Vercel ou équivalent Node.js ; Supabase managé.
- CinetPay : compte marchand requis avant production.
