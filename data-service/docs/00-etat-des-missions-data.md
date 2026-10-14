# État des missions DATA (Trello) — 13 octobre 2026

Légende : ✅ réalisé (à valider en équipe) · 🟡 réalisé en partie, la suite dépend d'un tiers · ⏳ pas encore
réalisable (projet pas assez avancé).

| # | Carte | Phase | État | Livrables | Ce qui bloque / reste à faire |
|---|---|---|---|---|---|
| 44 | Stratégie et architecture data | A | ✅ proposition | `03-note-cadrage-architecture-data.md`, trame `01` | trancher les 6 options le 16 oct. ; objectifs et justifications (Alexis) |
| 100 | Modèle de données partagé avec les devs | A | ✅ proposition | `05-modele-de-donnees.md`, `../service/sql/001_schemas_postgres.sql` | revue avec les devs (Doctrine fait foi) |
| 101 | Veille marché : concurrents de l'équipe, étude de marché | A | ✅ | config réalignée et publiée, `12-chiffres-cles-marche.md`, dashboard en ligne | vérifier les SIREN (Ecolearn : procédure collective ?) |
| 59 | Registre des traitements, RGPD, politique de confidentialité v1 | B | ✅ brouillons | `04-registre-traitements-v0.md`, `10-politique-de-confidentialite-v1.md` | points ouverts (rôle de sous-traitant, analytics, durées, AIPD formations) |
| 102 | Spécification du calcul de score | B | ✅ spec + prototype testé | `06-specification-score.md`, `../service/reglo_data/scoring.py` (20 tests) | contenu réel du questionnaire et pondérations (expertise QHSE / Business) |
| 103 | Contrat d'événements et indicateurs du tableau de bord | B | ✅ proposition + indicateurs codés | `07-contrat-evenements-et-indicateurs.md`, `indicators.py` | émission des événements par les devs ; seuil « échéance proche » |
| 69 | Collecte, traitement, premiers tableaux de bord | C | 🟡 | BI admin (trame), API d'indicateurs, veille marché en ligne | brancher sur la v0.1 des devs (18 déc.) |
| 104 | Veille réglementaire produit (US-11) | C | 🟡 chaîne + API prêtes | `08-veille-reglementaire-produit.md`, `regulatory/` (JORF sans clé, EUR-Lex) | affichage dans la plateforme (devs, v0.5), alertes par organisation |
| 76 | Automatisations ou IA | C | 🟡 automatisation faite | collectes quotidiennes (veille marché, réglementaire), classement automatique, alertes qualité | décision sur une option IA (IA Act) |
| 82 | Qualité des données, tests, dossier individuel v1 | C | 🟡 | `09-qualite-tests-recettage.md`, `quality.py`, 41 + 27 tests, `bench-resultats.md`, `13-plan-dossier-individuel-data.md`, échantillon à annoter | contrôles sur données réelles ; rédaction du dossier (Alexis) |
| 89 | Gouvernance : charte utilisateur, politique de confidentialité | C | 🟡 brouillons | `11-charte-utilisateur-v0.md`, `10-politique…` | finaliser sur la plateforme stabilisée |
| 93 | Recettage et documentation data | C | ⏳ / 🟡 doc faite | plan de recette (R1 à R11), `../service/README.md` | recette sur la plateforme déployée et le VPS |

## Dépendances externes à lever

1. **Réunion du 16 oct.** : valider l'architecture (03), le modèle (05) et les échéances.
2. **Devs** : migrations Doctrine du modèle, appel de `POST /scores` et `GET /veille/texts`, émission des
   événements, écrans du tableau de bord et du fil réglementaire.
3. **Florian (cyber)** : ressources du VPS, conteneur du service data sur le réseau interne, rôle PostgreSQL,
   tâche de collecte quotidienne.
4. **Business / expertise QHSE** : contenu réel du questionnaire et pondérations ; grille tarifaire (marché
   adressable en euros).
5. **Alexis** : décisions, justifications, édito, annotation de l'échantillon de veille, rédaction du dossier.
