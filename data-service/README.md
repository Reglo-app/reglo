# REGLO · data-service

Tout le travail de la filière data de REGLO. Chaque sous-dossier est un projet autonome, avec son propre README.

| Dossier | Contenu | Stack | Statut |
|---|---|---|---|
| [`service/`](service/) | Service data appelé par l'API Symfony : score du diagnostic, veille réglementaire (JORF, EUR-Lex), indicateurs du tableau de bord, contrôles de qualité | Python 3.11, FastAPI, SQLAlchemy | Prototype testé, en attente d'intégration |
| [`docs/`](docs/) | Documentation data : cadrage, architecture, modèle de données, spécifications, RGPD, recette | Markdown | Propositions à valider en équipe |
| [`bi-admin/`](bi-admin/) | Maquette du tableau de bord d'administration (8 onglets), sur données fictives | React, TypeScript, Vite | Trame à intégrer par les devs |
| [`veille-marche/`](veille-marche/) | Outil interne de veille marché (presse, concurrents, réglementation UE, sinistralité AT/MP) et dashboard | Python, Streamlit | Utilisé pour l'étude de marché |

## Arborescence

```
data-service/
├── README.md          ce fichier
├── service/           API FastAPI (code de production)
│   ├── reglo_data/    code du service
│   ├── tests/         tests pytest (hors ligne)
│   ├── sql/           modèle de données partagé (référence pour Doctrine)
│   └── bench.py       banc de montée en charge
├── docs/              documentation data (fichiers numérotés)
├── bi-admin/          maquette BI admin
└── veille-marche/     outil de veille marché
```

## Règles

- Le workflow Git et les conventions de commit sont dans [`CONTRIBUTING.md`](../CONTRIBUTING.md).
- Aucune base de données, aucun journal ni rapport généré n'est versionné (voir [`.gitignore`](.gitignore)).
- Aucun secret dans le dépôt : les variables d'environnement sont listées dans le README de chaque projet.
