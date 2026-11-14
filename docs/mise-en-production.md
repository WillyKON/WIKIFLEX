# Guide de mise en production — METRODOC CI (Étape 5)

> Objectif : passer du MVP fonctionnel à une boutique en ligne réelle,
> capable d'encaisser des paiements Mobile Money en toute sécurité.

## 0. Vue d'ensemble

| Domaine | Statut MVP | À faire pour la production |
|---------|-----------|---------------------------|
| Code / hébergement | ✅ Netlify (preview OK) | Déployer `main` + domaine final |
| Base de données | ✅ Schéma + seed fournis | Exécuter les SQL sur le projet Supabase réel |
| Authentification | ✅ Implémentée | Configurer les URLs de redirection Supabase |
| Paiement | ✅ Flux sécurisé complet | Passer CinetPay en mode production + tests |
| SEO / sécurité | ✅ Headers, robots, sitemap | Soumettre le sitemap à Google |
| Emails | ❌ Non implémenté | Optionnel (confirmation de commande) |

## 1. Base de données Supabase

1. Créer le projet sur https://supabase.com (région la plus proche, ex. `eu-west`/`eu-central`).
2. SQL Editor → exécuter **`supabase/schema.sql`** (tables, RLS, triggers, bucket privé).
3. SQL Editor → exécuter **`supabase/seed.sql`** (6 catégories + 6 produits de démonstration).
4. Se promouvoir administrateur (SQL Editor) :
   ```sql
   update public.profiles set role = 'admin' where id = 'VOTRE_UUID';
   ```
   (L'UUID se trouve dans Authentication → Users après votre inscription.)
5. Storage → vérifier que le bucket `documents` est bien **privé**.
6. Paramètres → API : relever l'URL du projet, la clé `anon` (publique) et la clé
   `service_role` (SECRÈTE — jamais côté client, jamais commitée).

## 2. Authentification Supabase

Authentication → URL Configuration :
- **Site URL** : `https://VOTRE-DOMAINE` (le domaine final, en HTTPS)
- **Redirect URLs** : ajouter
  - `https://VOTRE-DOMAINE/connexion`
  - `https://VOTRE-DOMAINE/**` (si emails de confirmation avec liens profonds)
- Si les emails de confirmation sont activés : configurer un expéditeur SMTP
  personnalisé (Paramètres → Auth → SMTP) pour un envoi fiable.

## 3. Déploiement Netlify

1. Site settings → Environment variables — définir :

   | Variable | Valeur |
   |----------|--------|
   | `NEXT_PUBLIC_APP_URL` | `https://VOTRE-DOMAINE` |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` (secrète) |
   | `CINETPAY_API_KEY` | clé API CinetPay |
   | `CINETPAY_SITE_ID` | site_id CinetPay |

2. Déploiement → Trigger deploy (les variables ne s'appliquent qu'aux nouveaux déploiements).
3. Vérifier que le déploiement `main` est vert et que https://VOTRE-DOMAINE répond.

## 4. Domaine et HTTPS

1. Acheter le domaine (ex. `metrodoc.ci` chez un registrar ivoirien ou international).
2. Netlify → Domain management → Add domain → suivre les instructions DNS
   (enregistrements A/CNAME fournis par Netlify).
3. HTTPS : Netlify provisionne automatiquement un certificat Let's Encrypt ;
   activer **« Force HTTPS »**.
4. Mettre à jour `NEXT_PUBLIC_APP_URL` et la configuration Supabase avec le domaine final.

## 5. CinetPay — passage en production

1. Compléter l'activation marchande CinetPay (KYB : pièce d'identité, registre du
   commerce ou équivalent, RIB mobile money). Sans cela, le mode production reste bloqué.
2. Back-office CinetPay → Paramètres → **Notification URL** :
   `https://VOTRE-DOMAINE/api/webhooks/cinetpay` (doit être en HTTPS public).
3. Récupérer les identifiants **mode PRODUCTION** (site_id + apikey) et les mettre
   dans les variables Netlify.
4. Effectuer un **premier paiement réel à faible montant** (ex. 100 FCFA) sur un
   produit de test, vérifier : webhook reçu, commande `paid`, téléchargement OK,
   puis rembourser ou retirer le produit de test.

## 6. Vérifications post-déploiement (checklist)

- [ ] `https://VOTRE-DOMAINE/api/health` renvoie `{"status":"ok"}`
- [ ] Accueil, catalogue, fiche produit s'affichent avec les produits réels
- [ ] Inscription + connexion fonctionnent (email de confirmation reçu si activé)
- [ ] Ajout au panier → paiement → retour `/bibliotheque?transaction=...` → commande `paid`
- [ ] Webhook CinetPay reçu (logs Netlify : fonction `/api/webhooks/cinetpay`)
- [ ] Téléchargement sécurisé : URL signée, expire, refusé si non acheté
- [ ] `/administration` accessible uniquement avec le compte admin
- [ ] En-têtes de sécurité présents (https://securityheaders.com) : X-Frame-Options,
      X-Content-Type-Options, Referrer-Policy, HSTS
- [ ] `https://VOTRE-DOMAINE/robots.txt` et `/sitemap.xml` corrects
- [ ] Page 404 et page d'erreur personnalisées
- [ ] Numéro WhatsApp réel dans le pied de page (`components/Footer.tsx`)
- [ ] Sauvegarde Supabase activée (Paramètres → Database → Backups, plan payant) ou
      export SQL manuel hebdomadaire

## 7. SEO et référencement

1. Google Search Console → ajouter la propriété `https://VOTRE-DOMAINE`.
2. Soumettre `https://VOTRE-DOMAINE/sitemap.xml`.
3. Vérifier l'indexation des fiches produits (`/produits/<slug>`).
4. Partager le lien sur les réseaux avec les visuels de `public/promotion/`
   (voir `docs/promotion/plan-lancement.md`).

## 8. Maintenance continue

- Surveiller les logs Netlify (Functions) pour les erreurs webhook / paiement.
- Consulter `/administration/commandes` chaque semaine (export CSV pour la comptabilité).
- Mettre à jour les dépendances régulièrement : `npm outdated`, `npm audit fix`.
- Renouveler le certificat Netlify (automatique) et le domaine (annuel).
- Sauvegarder le schéma et les données Supabase avant toute modification du SQL.
