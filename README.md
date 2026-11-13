# METRODOC CI — La bibliothèque technique africaine

Boutique numérique de documents techniques (métrologie, qualité, QHSE, analyses).
Next.js 15 (App Router) + Supabase (PostgreSQL, Auth, Storage) + CinetPay (Mobile Money XOF).

## Prérequis (Windows)

- Node.js 20+ ([nodejs.org](https://nodejs.org))
- VS Code
- Un projet [Supabase](https://supabase.com) (gratuit)
- Un compte marchand [CinetPay](https://cinetpay.com) (pour les paiements réels)

## Installation

```bash
npm install
```

Créez `.env.local` à partir de `.env.example` (copier-coller puis remplir avec
vos propres clés, récupérées dans vos tableaux de bord Supabase et CinetPay).

## Configuration Supabase

1. Ouvrez le **SQL Editor** de votre projet Supabase.
2. Collez et exécutez le contenu de `supabase/schema.sql`
   (tables, RLS, déclencheur de profil, bucket privé `documents`).
3. Exécutez ensuite `supabase/seed.sql` (catégories + 6 documents de démonstration).
4. Dans **Authentication → URL Configuration**, ajoutez
   `http://localhost:3000/connexion` dans les Redirect URLs.
5. Après votre première inscription, promouvez-vous administrateur :

```sql
update public.profiles set role = 'admin' where id = 'VOTRE_UUID';
```

## Lancement

```bash
npm run dev
```

Ouvrez http://localhost:3000.

## Ce qui est implémenté (Étape 2)

- Clients Supabase navigateur / SSR / service_role + rafraîchissement de session (middleware).
- Inscription, connexion, déconnexion, profil (nom, téléphone) — `app/actions/auth.ts`.
- Schéma PostgreSQL complet avec RLS (`supabase/schema.sql`) + seed.
- Catalogue dynamique : recherche, filtres catégorie/format, tri par prix (fallback démo si Supabase absent).
- Fiches produits, panier persistant (localStorage), page compte avec historique de commandes.
- Bibliothèque personnelle (documents des commandes payées).
- Endpoint paiement `/api/pay` : prix recalculés côté serveur, commande en base, initialisation CinetPay.
- Webhook `/api/webhooks/cinetpay` : re-vérification du statut auprès de CinetPay, anti-doublon, contrôle du montant.
- Téléchargement sécurisé `/api/download/[itemId]` : droit vérifié + URL signée (bucket privé, 5 min).
- Tableau de bord administrateur (statistiques produits / clients / ventes / CA).

## Ce qui reste à faire

- Tests sandbox CinetPay de bout en bout (paiement réel en mode test).
- Formulaire d'administration des produits (création / modification / publication).
- Envoi des fichiers réels dans le bucket `documents` (chemins renseignés dans `products.file_path`).
- Emails transactionnels (confirmation de commande).
- Domaine, HTTPS et mise en production.

## Sécurité

- Aucune clé secrète dans le code : tout passe par `.env.local` (jamais commité).
- Les prix sont toujours relus côté serveur avant création de commande.
- Le webhook ne fait jamais confiance à la notification : statut re-vérifié auprès de CinetPay.
- Les commandes ne sont créables/modifiables que via la clé service_role (aucune policy d'écriture RLS).
- Les fichiers vendus sont dans un bucket privé ; accès uniquement par URL signée après vérification du droit.
