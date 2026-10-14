# Banc de montée en charge du service data

Mesuré le 2026-10-13 sur le poste de développement (SQLite, Python 3.11). Données synthétiques. À remesurer sur le VPS (PostgreSQL).

| Traitement | Volume | Temps total (s) | Temps unitaire (ms) |
|---|---|---|---|
| Calcul de score | 100 diagnostics | 0.005 | 0.046 |
| Calcul de score | 1 000 diagnostics | 0.058 | 0.058 |
| Calcul de score | 10 000 diagnostics | 0.543 | 0.054 |
| Veille : insertion | 1 000 textes | 0.014 | 0.014 |
| Veille : lecture filtrée (US-11) | 1 000 textes | 0.002 | 2.475 |
| Veille : insertion | 10 000 textes | 0.122 | 0.012 |
| Veille : lecture filtrée (US-11) | 10 000 textes | 0.015 | 15.315 |
| Veille : insertion | 50 000 textes | 0.700 | 0.014 |
| Veille : lecture filtrée (US-11) | 50 000 textes | 0.139 | 138.586 |
| Indicateurs d'une organisation | 10 organisations (50 actions et 20 salariés chacune) | 0.102 | 2.036 |
| Indicateurs d'une organisation | 100 organisations (50 actions et 20 salariés chacune) | 0.085 | 1.692 |
| Indicateurs d'une organisation | 1 000 organisations (50 actions et 20 salariés chacune) | 0.370 | 7.404 |
