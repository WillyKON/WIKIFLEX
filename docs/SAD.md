# SAD — Architecture logicielle détaillée (METRODOC CI)

Version 0.2 — Phase 2

## 1. Vue d'ensemble

```
Navigateur ── Next.js (App Router, RSC + Server Actions)
                 ├─ Supabase Auth (session via cookies, middleware)
                 ├─ PostgreSQL (RLS) via @supabase/ssr (anon) ou service_role (serveur)
                 ├─ Supabase Storage privé (URLs signées)
                 └─ CinetPay REST v2 (init + check) + webhook
```

## 2. Structure du code

```
app/
  page.tsx                     Accueil (RSC, force-dynamic)
  catalogue/page.tsx           Catalogue dynamique (recherche/filtres/tri en URL)
  produits/[slug]/page.tsx     Fiche produit
  panier/page.tsx              Panier (client) + paiement
  connexion|inscription/       Auth (useActionState + Server Actions)
  compte/page.tsx + ProfileForm  Profil + commandes
  bibliotheque/page.tsx        Documents payés
  administration/page.tsx      Stats (service_role, gardé par rôle)
  actions/auth.ts              Server Actions (signUp/signIn/signOut/updateProfile)
  api/pay/route.ts             Création commande + init CinetPay
  api/webhooks/cinetpay/route.ts  Notification → vérification → validation
  api/download/[itemId]/route.ts  Droit + URL signée
components/                    Header, Footer, SearchBar, ProductCard, CartProvider, AddToCartButton
lib/
  supabase/{client,server,admin,middleware}.ts   Clients Supabase (navigateur/SSR/service_role/session)
  catalog.ts           Accès catalogue (Supabase, fallback démo)
  cinetpay.ts          Client REST CinetPay (init + check)
  format.ts            FCFA, dates FR
supabase/{schema,seed}.sql   Base de données
```

## 3. Clients Supabase

| Client | Fichier | Clé | Usage |
|--------|---------|-----|-------|
| Navigateur | `lib/supabase/client.ts` | anon | futur temps réel (non utilisé encore) |
| SSR / RSC | `lib/supabase/server.ts` | anon | lectures RLS, auth utilisateur |
| Admin | `lib/supabase/admin.ts` | service_role | écritures commandes, stats, URLs signées |

Le middleware (`middleware.ts` + `lib/supabase/middleware.ts`) rafraîchit la
session sur chaque requête et replante les cookies.

## 4. Sécurité

- RLS activée sur toutes les tables publiques ; SELECT seulement (profils : soi-même ; produits : publiés ; commandes : soi-même).
- Écritures sensibles (orders, order_items, products) : service_role uniquement, jamais exposé au navigateur.
- Webhook : contenu non fiable, statut re-vérifié via l'API CinetPay, contrôle d'écart de montant, transitions d'état restreintes.
- Téléchargements : bucket privé + URL signée 5 min après vérification du droit.
- Secrets : uniquement dans `.env.local` (hors git).

## 5. Décisions techniques

- **Prix entiers FCFA** : pas de flottants monétaires.
- **`order_items` dénormalisé** (titre + prix figés) : l'historique reste exact même si le produit change.
- **Fallback démo** : si Supabase n'est pas configuré, le catalogue affiche des données de démonstration — permet de développer l'UI sans dépendance.
- **Server Actions** pour l'auth : pas d'endpoints d'auth personnalisés, cookies gérés par `@supabase/ssr`.
