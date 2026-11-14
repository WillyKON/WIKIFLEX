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
- Réconciliation au retour client (`/bibliotheque?transaction=...`) : filet de sécurité idempotent si le webhook est perdu.
- Téléchargement sécurisé `/api/download/[itemId]` : droit vérifié + URL signée (bucket privé, 5 min).
- Tableau de bord administrateur (statistiques produits / clients / ventes / CA).
- Liste des clients (`/administration/clients`) : nom, email, date d'inscription, commandes payées, total dépensé.
- Liste des commandes (`/administration/commandes`) + export CSV (compatible Excel, séparateur `;`, BOM UTF-8).
- Gestion des documents : création, modification, publication/dépublication, suppression (dépublication si historique de ventes) et upload du fichier vers le bucket privé `documents` (25 Mo max).

## Tester le paiement (sandbox CinetPay)

1. Dans le back-office CinetPay, récupérez votre **site_id** et **apikey** du mode TEST et renseignez-les dans `.env.local`.
2. Démarrez l'application en ligne (`npm run dev` + un tunnel HTTPS type `ngrok http 3000` pour que CinetPay puisse appeler le webhook), et définissez `NEXT_PUBLIC_APP_URL` sur l'URL publique.
3. Dans le back-office CinetPay → Paramètres → Notification, renseignez aussi l'URL du webhook : `https://VOTRE-DOMAINE/api/webhooks/cinetpay`.
4. Ajoutez un document au panier, connectez-vous, cliquez « Payer par Mobile Money » et suivez le flux de paiement de test.
5. Vérifiez : retour sur `/bibliotheque?transaction=...` avec bandeau de statut, commande `paid` dans Supabase, document téléchargeable.

Le statut est vérifié à deux endroits, de façon idempotente :
- **Webhook** `POST /api/webhooks/cinetpay` (notification serveur-à-serveur) ;
- **Retour client** : la page `/bibliotheque?transaction=...` re-vérifie la transaction auprès de CinetPay si la commande est encore `pending` (filet de sécurité si le webhook est perdu).

Aucun paiement réel ne doit être encaissé avant validation complète du mode test.

## Ce qui reste à faire

- Tests sandbox CinetPay de bout en bout (paiement réel en mode test).
- Emails transactionnels (confirmation de commande).
- Domaine, HTTPS et mise en production.

## Sécurité

- Aucune clé secrète dans le code : tout passe par `.env.local` (jamais commité).
- Les prix sont toujours relus côté serveur avant création de commande.
- Le webhook ne fait jamais confiance à la notification : statut re-vérifié auprès de CinetPay.
- Les commandes ne sont créables/modifiables que via la clé service_role (aucune policy d'écriture RLS).
- Les fichiers vendus sont dans un bucket privé ; accès uniquement par URL signée après vérification du droit.
