# SFD — Spécification fonctionnelle détaillée (METRODOC CI)

Version 0.2 — Phase 2

## 1. Modèle de données (PostgreSQL / Supabase)

| Table | Rôle | Points clés |
|-------|------|-------------|
| `profiles` | Profil client/admin | 1:1 avec `auth.users`, `role` enum `client`/`admin`, créé par trigger |
| `categories` | Catégories du catalogue | slug unique, lecture publique |
| `products` | Documents vendus | prix entier FCFA, `promo_price_fcfa`, `file_path` (storage), `is_published` |
| `orders` | Commandes | statut `pending→paid/failed/cancelled`, `cinetpay_transaction_id` unique |
| `order_items` | Lignes figées | titre + prix au moment de l'achat |

## 2. Règles de gestion

- RG-01 : le prix facturé est **toujours** relu en base côté serveur (`/api/pay`) ; le panier client n'est qu'indicatif.
- RG-02 : une commande passe de `pending` à `paid` **uniquement** via le webhook, après re-vérification auprès de CinetPay (statut + montant exact).
- RG-03 : anti-doublon — seule une commande `pending` peut évoluer ; les notifications suivantes sont ignorées.
- RG-04 : un téléchargement n'est autorisé que si l'utilisateur est propriétaire d'une commande `paid` contenant le produit.
- RG-05 : les fichiers sont servis par URL signée (bucket privé `documents`, TTL 5 minutes).
- RG-06 : seules les politiques SELECT existent côté client ; toute écriture sur commandes/produits passe par la clé service_role.

## 3. Flux de paiement

1. Client connecté clique « Payer par Mobile Money » → `POST /api/pay` (slugs du panier).
2. Serveur : relecture des prix, création `orders` (`pending`) + `order_items`, ID transaction `MDCI-...`.
3. Serveur : `POST https://api-checkout.cinetpay.com/v2/payment` → `payment_url`.
4. Client redirigé vers CinetPay (Orange Money, MTN MoMo, Moov, Wave).
5. CinetPay notifie `POST /api/webhooks/cinetpay` (`cpm_trans_id`).
6. Serveur : `POST /v2/payment/check` → si `ACCEPTED` et montant égal → commande `paid`.
7. Client revient sur `/bibliotheque` ; le document apparaît avec bouton de téléchargement.

## 4. Écrans

| Route | Type | Accès |
|-------|------|-------|
| `/` | Accueil (hero, catégories, sélection) | public |
| `/catalogue` | Liste + filtres (`?q=&categorie=&format=&tri=`) | public |
| `/produits/[slug]` | Fiche produit + ajout panier | public |
| `/panier` | Panier + paiement | public (paiement : connecté) |
| `/connexion`, `/inscription` | Auth | public |
| `/compte` | Profil + dernières commandes | connecté |
| `/bibliotheque` | Documents payés + téléchargement | connecté |
| `/administration` | Statistiques boutique | rôle `admin` |
