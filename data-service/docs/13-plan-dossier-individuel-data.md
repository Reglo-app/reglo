# Dossier individuel data — plan et preuves disponibles (v1)

> Carte « Qualité des données, tests et dossier individuel data v1 ». **Ce document est une trame** :
> il relie chaque critère de la grille d'évaluation (/33) aux livrables produits. La rédaction des
> analyses, des justifications de choix, de l'édito et de la conclusion revient à Alexis (règle IA,
> niveau 1). Ne pas oublier la déclaration d'usage de l'IA en annexe (journal dans `instruction.md`).

## Correspondance grille → preuves

| Bloc / critère | Ce que le jury attend | Preuves disponibles | Reste à faire (Alexis) |
|---|---|---|---|
| **Conception /12** — Spécifications techniques | besoins data couverts | 01 note de cadrage (trame), 03 architecture (§1-2), 06 score, 07 indicateurs, 08 veille | rédiger les objectifs et arbitrages (01) |
| Architecture technique data | schémas clairs, scalable, intégrée aux DFS | 03 (schéma, schémas PostgreSQL), 05 modèle + `sql/001`, contrat d'API | valider avec les devs, justifier les choix |
| Choix technologiques | veille techno, choix justifiés | 03 §3 (options A / B, critères) | trancher et justifier |
| Process de traitement | chaîne formalisée, liée à l'architecture | 03 §6, 08 §2, README veille | — |
| **Développement /9** — Plateforme data | briques en place, cohérentes avec les DFS | `../service/` (API, collecte, indicateurs), BI admin (`../bi-admin/`), veille (`../veille-marche/`, en ligne) | intégration sur le VPS |
| Développement data | code, qualité du code et des données, corrections | 41 + 27 tests, `quality.py`, 09 §2 (anomalies et corrections) | annoter l'échantillon de 40 textes (précision) |
| Réglementation | gouvernance, RGPD, IA Act, registre, politique, charte | 04 registre, 10 politique, 11 charte, exclusions nominatives testées | trancher les points ouverts, AIPD formations |
| **Tests, déploiement, automatisation /9** — Scénarios et recettage | scénarios cartographiés, recette | 09 §1 et §4 | dérouler la recette sur la plateforme |
| Déploiement | déploiement continu, montée en charge, dashboards exploités | veille : Streamlit Cloud + collecte quotidienne ; `bench-resultats.md` ; Dockerfile proposé | déploiement du service data sur le VPS, bench sur PostgreSQL |
| Automatisation | chaîne automatisée et / ou IA | collecte quotidienne (veille, réglementaire), classement automatique, alertes qualité | décision sur l'option IA (IA Act) |
| **Documentation /3** | installation, utilisateur, technique | README `../service/` et `../veille-marche/`, docs 03 à 12, `/docs` de l'API | captures pour la doc utilisateur |

## Plan proposé du dossier

1. Introduction et contexte Réglo — *à rédiger*
2. Stratégie data : rôle de la data par fonctionnalité, périmètre MVP (03 §1-2)
3. Spécifications : besoins data, score (06), indicateurs (07), veille (08)
4. Architecture et choix technologiques (03, 05) — *justifications à rédiger*
5. Chaîne de traitement et automatisation (08, veille)
6. Réglementation des données (04, 10, 11)
7. Tests, qualité, montée en charge, recettage (09, bench)
8. Déploiement et exploitation visuelle (dashboard en ligne, BI admin)
9. Documentation (README, API)
10. Retour d'expérience et conclusion personnelle — *à rédiger*
11. Annexes : lien vers le code source, déclaration d'usage de l'IA

## Points forts à mettre en avant à l'oral (faits mesurés)

- Collecte réglementaire réelle : 12 210 textes du JO lus sur 90 jours, 4 532 mesures nominatives écartées
  avant stockage (minimisation RGPD démontrée par des tests).
- Défauts trouvés par les tests et corrigés : limite SQLite au-delà de 30 000 textes, faux positifs de
  classement, textes anciens, homonymes de concurrents.
- Montée en charge chiffrée (banc reproductible).
- Une solution data déjà en production : veille marché en ligne, mise à jour chaque jour.
