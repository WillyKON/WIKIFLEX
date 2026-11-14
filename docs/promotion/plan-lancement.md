# Plan de lancement commercial — METRODOC CI

## Prérequis avant tout lancement (bloquant)

- [ ] Exécuter `supabase/schema.sql` puis `supabase/seed.sql` dans le SQL Editor Supabase
- [ ] Configurer les clés réelles dans `.env.local` (et sur Netlify : Site settings → Environment variables)
- [ ] Se promouvoir administrateur : `update public.profiles set role='admin' where id='VOTRE_UUID';`
- [ ] Tests CinetPay sandbox complets (paiement, webhook, retour bibliothèque, montant erroné)
- [ ] Remplacer le numéro WhatsApp placeholder dans `components/Footer.tsx`
- [ ] Domaine final + HTTPS actif

## Semaine 1 — Fondations (J1 à J7)

| Jour | Action | Support |
|------|--------|---------|
| J1 | Créer les comptes : page Facebook, TikTok, WhatsApp Business | `logo-metrodoc.jpg` en profil, `banniere-etudiant.jpg` en couverture |
| J2 | Publier le post d'annonce Facebook + statut WhatsApp | `textes-reseaux-sociaux.md` |
| J3 | Tourner la vidéo 30 s (ou l'assembler dans CapCut) | `script-video-30s.md` |
| J4 | Publier la vidéo TikTok + statut WhatsApp | `script-video-30s.md` |
| J5 | Message personnalisé à 20 contacts cibles (étudiants, techniciens) | Message WhatsApp de diffusion |
| J6 | Publier le post « paiement Mobile Money » | `visuel-paiement.jpg` |
| J7 | Bilan semaine : vues, clics, inscriptions | — |

## Semaine 2 — Amplification (J8 à J14)

- Publier la vidéo 60 s sur Facebook (et la découper en 3 extraits TikTok)
- Rejoindre 5 groupes Facebook d'étudiants/techniciens ivoiriens ; partager avec tact (apporter de la valeur, pas du spam)
- Lancer une **promotion de lancement** : -20 % sur 3 documents phares pendant 7 jours (champ `promo_price_fcfa` déjà prévu)
- Enregistrer le jingle 15 s et le placer en intro de toutes les vidéos
- Contacter 1 radio locale ou campus (Bouaké/Yamoussoukro) avec le script radio

## Semaines 3-4 — Routine et mesure

- Rythme : 3 posts/semaine (1 TikTok, 1 post Facebook, 1 statut WhatsApp)
- Chaque samedi : consulter `/administration` — ventes, chiffre d'affaires, commandes (`/administration/commandes`, export CSV)
- Réinvestir : mettre en avant les 2 documents les plus vendus dans les posts suivants

## Indicateurs à suivre

| Indicateur | Où le mesurer | Cible semaine 4 |
|-----------|---------------|-----------------|
| Inscriptions | Supabase Auth / `/administration/clients` | 100 comptes |
| Commandes payées | `/administration/commandes` | 30 |
| Chiffre d'affaires | Carte du tableau de bord admin | 75 000 FCFA |
| Vues vidéos cumulées | TikTok + Facebook | 10 000 |

## Budget indicatif (optionnel)

- Boost Facebook du post d'annonce : 5 000–10 000 FCFA sur 5 jours, ciblage Côte d'Ivoire 18-35 ans, intérêts « étudiant, ingénierie, qualité »
- Impression 100 flyers campus (Bondoukou/Bouaké) : ~15 000 FCFA — QR code vers metrodoc.ci
