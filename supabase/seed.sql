-- ============================================================
-- METRODOC CI — Données de démonstration
-- À exécuter APRÈS schema.sql dans le SQL Editor de Supabase.
-- ============================================================

insert into public.categories (slug, name, description) values
  ('metrologie', 'Métrologie', 'Incertitudes, étalonnage, GUM'),
  ('qhse', 'QHSE', 'Hygiène, sécurité, environnement'),
  ('qualite', 'Qualité', 'ISO 9001, ISO/IEC 17025, audits'),
  ('analyses', 'Analyses', 'Méthodes d''analyse et validation'),
  ('etudes', 'Études', 'Études techniques et rapports'),
  ('excel-outils', 'Excel & outils', 'Modèles et calculateurs')
on conflict (slug) do nothing;

insert into public.products
  (slug, title, description, category_id, price_fcfa, promo_price_fcfa, format, is_published)
values
  ('calcul-incertitude-gum',
   'Calcul d''incertitude GUM',
   'Classeur Excel complet appliquant le GUM : budget d''incertitude, lois de propagation, facteur d''élargissement k=2 et rapport d''étalonnage prêt à l''emploi.',
   (select id from public.categories where slug = 'metrologie'),
   2500, null, 'Excel', true),
  ('guide-iso-iec-17025',
   'Guide ISO/IEC 17025',
   'Guide de lecture de la norme ISO/IEC 17025:2017 : exigences de management et techniques, cartographie des écarts et plan de mise en conformité pour un laboratoire.',
   (select id from public.categories where slug = 'qualite'),
   2000, null, 'PDF', true),
  ('modele-audit-interne-9001',
   'Modèle d''audit interne ISO 9001',
   'Trame d''audit interne complète : plan d''audit, checklist par processus, fiche de constat et rapport d''audit conformes à ISO 9001:2015.',
   (select id from public.categories where slug = 'qualite'),
   1500, 1000, 'Excel', true),
  ('cahier-verification-balance',
   'Cahier de vérification d''une balance',
   'Procédure de vérification périodique d''une balance : tests d''excentricité, de répétibilité et d''exactitude, avec feuille de calcul des tolérances.',
   (select id from public.categories where slug = 'metrologie'),
   1000, null, 'PDF', true),
  ('plan-prevention-chantier',
   'Plan de prévention chantier',
   'Modèle de plan de prévention et de coordination SPS : analyse des risques par lot, mesures de prévention et registre de sécurité.',
   (select id from public.categories where slug = 'qhse'),
   3000, null, 'Word', true),
  ('validation-methodes-analyse',
   'Validation des méthodes d''analyse',
   'Dossier type de validation de méthode : linéarité, limite de détection, limite de quantification, fidélité et justesse, avec exemples chiffrés.',
   (select id from public.categories where slug = 'analyses'),
   2500, null, 'PDF', true)
on conflict (slug) do nothing;

-- ============================================================
-- Promouvoir votre compte en administrateur :
-- remplacez l'UUID par celui de VOTRE compte (visible dans
-- Supabase → Authentication → Users) puis exécutez :
--
-- update public.profiles set role = 'admin' where id = 'VOTRE_UUID';
-- ============================================================
