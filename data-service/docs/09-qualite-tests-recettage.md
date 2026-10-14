# Réglo — Qualité des données, tests et recettage de la partie data

> Cartes : « Qualité des données, tests et dossier individuel data v1 » (22 janv.) et « Recettage et
> documentation de la partie data » (5 févr.). **Statut : tout ce qui ne dépend pas de la plateforme est
> fait et passant ; le recettage final se fera sur la plateforme déployée.**

## 1. Cartographie des scénarios de test (besoin → scénario → test)

### Service data (`../service/`, 41 tests, tous passants)

| Besoin (US / exigence) | Scénarios | Fichier |
|---|---|---|
| US-04 Score global, par pilier et par thématique | maximum, minimum, pondérations calculées à la main, types de réponses, plafond multi-choix, déterminisme, seuils de maturité | `test_scoring.py` (20) |
| US-03 Validation impossible si champ obligatoire vide | question manquante, réponse invalide (4 cas), question inconnue, N/A interdit | `test_scoring.py` |
| Règle de preuve, non applicable, écarts prioritaires | plafond à 50, N/A exclu, tri et valeur des écarts | `test_scoring.py` |
| US-11 Textes récents filtrables par thème | classement thématique, faux positifs évités, filtres thème / secteur / date, liste vide | `test_regulatory.py` (9), `test_indicators_quality_api.py` |
| RGPD : aucune mesure nominative | 4 tournures nominatives, archive avec nomination écartée | `test_regulatory.py` |
| Robustesse de la collecte | XML invalide ignoré, archive réelle du JO, dédoublonnage EUR-Lex, idempotence | `test_regulatory.py` |
| Fonctionnalité 6 Tableau de bord | score et évolution, retards, échéances proches, formations, certificats, documents, alertes | `test_indicators_quality_api.py` (12) |
| **Isolation entre organisations** | une organisation ne voit jamais les chiffres d'une autre | `test_indicators_quality_api.py` |
| Qualité des données | anomalies détectées, veille périmée, mode « plateforme absente » | `test_indicators_quality_api.py` |
| Sécurité du service | jeton absent / faux / bon ; supervision ouverte | `test_indicators_quality_api.py` |
| API | santé, score, 422, 404, veille, indicateurs, qualité | `test_indicators_quality_api.py` |

### Veille marché (`../veille-marche/`, 27 tests, tous passants)

Normalisation, classement, score minimal, homonymes des concurrents, lecture RSS, lien Bing réel,
détection de l'anglais, filtre d'ancienneté, détection des changements de pages et de prix, requêtes
EUR-Lex et BOAMP, annonces BODACC, digest complet de bout en bout, export HTML sécurisé.

## 2. Qualité des données mesurée

| Contrôle | Où | Mesure corrective |
|---|---|---|
| Fraîcheur de la veille (≤ 4 jours) | `quality.py` | relancer la collecte, consulter `collection_run` |
| Doublons de références (NOR / CELEX) | `quality.py` | dédoublonnage par référence |
| Textes sans thème | `quality.py` | ajuster la taxonomie |
| Collectes en échec (7 jours) | `quality.py` | ex. EUR-Lex lent : seconde tentative automatique, alerte sinon |
| Diagnostics validés sans score | `quality.py` (plateforme) | relancer `POST /scores` |
| Scores hors 0-100 | `quality.py` (plateforme) | recalcul |
| Échéance antérieure à la création | `quality.py` (plateforme) | contrôle côté API (US-05) |
| Documents non conformes (format, 20 Mo) | `quality.py` (plateforme) | contrôle à l'upload (US-07) |
| Progression / quiz hors bornes | `quality.py` (plateforme) | correction du calcul côté plateforme |
| Précision du classement de la veille | échantillon de 40 textes à annoter (`echantillon-veille-a-annoter.csv`) | ajuster `taxonomy.py` |

État au 13 oct. : 3 contrôles OK, 1 alerte (échec ponctuel d'EUR-Lex, corrigé par la relance),
5 « non applicables » en attente des tables de la plateforme.

**Corrections déjà apportées grâce aux tests et aux mesures** : textes anciens filtrés par date, faux
positifs de la taxonomie (« Menergy », « double mobilité »), mesures nominatives oubliées, limite SQLite
au-delà de 30 000 textes (traitement par lots), plantage du contrôle qualité sans plateforme.

## 3. Montée en charge

Voir `bench-resultats.md` : score ≈ 0,05 ms par diagnostic (10 000 diagnostics en 0,56 s) ; indicateurs
≈ 7 ms par organisation avec 1 000 organisations ; lecture filtrée de la veille ≈ 94 ms à 50 000 textes
sous SQLite (index GIN prévu sous PostgreSQL). **À remesurer sur le VPS.**

## 4. Recettage final (à dérouler sur la plateforme déployée)

| # | Scénario de recette | Résultat attendu | Statut |
|---|---|---|---|
| R1 | Un responsable valide un diagnostic complet | scores affichés (global, piliers, détail), écarts proposés | ⏳ plateforme |
| R2 | Validation avec un champ obligatoire vide | refus, champ signalé, réponses conservées | ⏳ |
| R3 | Service data arrêté pendant la validation | message clair, réponses conservées (US-04) | ⏳ |
| R4 | Deuxième diagnostic | évolution du score affichée (US-10) | ⏳ |
| R5 | Fil réglementaire filtré par thème, puis thème vide | textes du thème ; message « aucune actualité » | ⏳ |
| R6 | Organisation du BTP | textes généraux + textes ciblés BTP, pas ceux ciblés transport | ⏳ |
| R7 | Tableau de bord avec actions en retard et proches | compteurs exacts (comparés à une requête SQL de contrôle) | ⏳ |
| R8 | Deux organisations | aucun chiffre croisé | ⏳ |
| R9 | Collecte quotidienne sur le VPS pendant 7 jours | 7 collectes OK, fraîcheur OK | ⏳ VPS |
| R10 | Contrôles qualité sur données réelles | 0 erreur, alertes expliquées | ⏳ |
| R11 | Montée en charge sur le VPS | temps du banc, sous PostgreSQL | ⏳ VPS |

## 5. Documentation livrée

- Guide d'installation, utilisation et API : `../service/README.md` (+ documentation interactive `/docs`)
- Documentation technique : note d'architecture (03), modèle de données (05), score (06), indicateurs (07),
  veille réglementaire (08)
- Documentation utilisateur : charte utilisateur (11) ; contenus d'aide de la plateforme à rédiger avec
  les devs une fois les écrans livrés
