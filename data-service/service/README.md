# Réglo · service data

Petit service Python (FastAPI) prévu par le dossier technique, à côté de l'API Symfony :
**score du diagnostic**, **veille réglementaire**, **indicateurs du tableau de bord**, **qualité des données**.

> Statut : prototype testé (41 tests), en attente de la plateforme des devs pour l'intégration.
> Les choix d'architecture sont des propositions à valider ([`../docs/03-note-cadrage-architecture-data.md`](../docs/03-note-cadrage-architecture-data.md)).

## Installation

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt     # Windows
# source .venv/bin/activate && pip install -r requirements.txt   (Linux / VPS)
```

Variables d'environnement :

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | base de données (PostgreSQL en production) | `sqlite:///data/reglo_data.sqlite` |
| `SERVICE_TOKEN` | jeton partagé avec l'API Symfony (en-tête `X-Service-Token`) | aucun (développement) |
| `REGLO_DEMO_APP_TABLES` | `1` = crée aussi les tables `app` vides (démo hors plateforme) | non |

**Ne jamais écrire le jeton ni le mot de passe de la base dans un fichier du dépôt.**

## Utilisation

```bash
python -m reglo_data init-db                  # crée les tables du service data
python -m reglo_data collect --days 90        # collecte JORF + EUR-Lex (puis --days 2 chaque jour)
python -m reglo_data quality                  # contrôles de qualité (JSON)
python -m reglo_data serve                    # API sur http://127.0.0.1:8000 (documentation : /docs)
python -m pytest                              # tests (hors ligne)
python bench.py                               # banc de montée en charge → ../docs/bench-resultats.md
```

## API

| Route | Usage | Réponse |
|---|---|---|
| `GET /health` | supervision | statut, versions |
| `POST /scores` | à la validation d'un diagnostic | scores global / piliers / thématiques, maturité, couverture, 3 écarts ; **422** si incomplet |
| `GET /veille/texts?theme=&naf=&since=&limit=` | fil réglementaire (US-11) | textes récents filtrés ; `total: 0` si rien |
| `GET /organizations/{id}/indicators` | tableau de bord central | score et évolution, actions (retard, échéance proche), formations, certificats, documents, alertes |
| `GET /quality` | supervision data | résultat des contrôles |

Exemple :

```bash
curl -X POST http://127.0.0.1:8000/scores -H "Content-Type: application/json" -d '{
  "questionnaire_version": "exemple-1",
  "answers": [{"question_id": "S1", "value": "yes", "justification": "DUERP 2026"}, …]
}'
```

## Architecture du code

```
reglo_data/
├── scoring.py              calcul du score (pur, versionné : ALGO_VERSION)
├── questionnaire_example.json   questionnaire FICTIF de démonstration
├── taxonomy.py             thèmes clients (Loi Climat, CSRD, Déchets, Social), ciblage NAF, exclusions RGPD
├── regulatory/
│   ├── jorf.py             Journal officiel (open data DILA, sans clé)
│   ├── eurlex.py           EUR-Lex (SPARQL)
│   └── store.py            enregistrement par lots, lecture filtrée
├── indicators.py           indicateurs du tableau de bord (filtrés par organisation)
├── quality.py              contrôles de qualité des données
├── db.py                   tables (SQLAlchemy Core) ; schémas app / veille / analytics
├── api.py                  API FastAPI
└── __main__.py             ligne de commande
sql/001_schemas_postgres.sql   modèle de données partagé (référence pour Doctrine)
tests/                         41 tests (score, veille, indicateurs, qualité, API, sécurité)
bench.py                       montée en charge
```

## Déploiement (proposition, à caler avec Florian)

Conteneur Docker sur le VPS, dans le Docker Compose de la plateforme, sur le réseau interne uniquement
(jamais exposé sur Internet : seule l'API Symfony l'appelle).

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY reglo_data ./reglo_data
USER nobody
CMD ["uvicorn", "reglo_data.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Collecte quotidienne : `python -m reglo_data collect --days 2` via cron du conteneur (ou tâche planifiée
de l'hôte). Rôle PostgreSQL dédié : lecture sur `app`, écriture sur `veille` et `analytics`.

## Sécurité et RGPD

- Jeton de service comparé en temps constant ; `/health` seul reste ouvert.
- Toutes les lectures d'indicateurs sont filtrées par organisation (testé).
- La veille n'enregistre aucune mesure nominative du JO (testé) ; métadonnées publiques uniquement.
- Aucune IA, aucune donnée de santé nominative.
