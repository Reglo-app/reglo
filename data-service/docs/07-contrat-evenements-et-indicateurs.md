# Réglo — Contrat d'événements produit et indicateurs du tableau de bord

> **Statut : proposition v1** (carte « Contrat d'événements produit et indicateurs du tableau de bord »).
> Indicateurs implémentés et testés : `../service/reglo_data/indicators.py` (route
> `GET /organizations/{id}/indicators`). Événements : table `analytics.event`.
> À valider avec les devs, qui émettront les événements depuis Next.js et Symfony.

## 1. Règles communes des événements

- Un événement = `name`, `occurred_at` (UTC), `organization_id`, `user_id`, `session_id`, `properties`.
- **Aucun contenu métier** dans `properties` (ni texte de réponse, ni nom de document, ni donnée de
  santé) : seulement des identifiants et des valeurs techniques.
- Envoi côté serveur (Symfony) quand c'est possible ; côté navigateur seulement pour les pages vues et
  les erreurs front.
- Conservation : 13 mois pour les événements bruts, agrégats au-delà (registre, traitement A4).

## 2. Plan de marquage

| Événement | Émis par | Quand | `properties` | Sert à |
|---|---|---|---|---|
| `session_started` | Next.js | ouverture de l'app (au plus 1 toutes les 30 min) | `version`, `browser`, `device`, `load_time_ms` | Santé, Adoption, Connexions (BI admin) |
| `page_viewed` | Next.js | changement de page | `page` | Fonctionnalités utilisées |
| `error_raised` | Next.js / Symfony | erreur non gérée | `message`, `type`, `page`, `version` | Santé du système |
| `organization_activated` | Symfony | US-01 | `plan` | Entonnoir d'adoption |
| `diagnostic_started` | Symfony | US-03 | `diagnostic_id`, `questionnaire_version` | Entonnoir |
| `diagnostic_validated` | Symfony | US-04 | `diagnostic_id`, `global_score`, `algo_version` | Entonnoir, évolution du score |
| `action_created` | Symfony | US-05 | `action_id`, `pillar`, `from_gap` (booléen) | Plan d'actions |
| `action_status_changed` | Symfony | US-06 | `action_id`, `from`, `to` | Délai de réalisation |
| `document_uploaded` | Symfony | US-07 | `document_id`, `mime`, `size_bytes` | Contenu |
| `training_started` / `training_completed` | Symfony | US-08 | `module_id`, `free`, `quiz_score` | Formations |
| `certificate_issued` | Symfony | certification | `certificate_id`, `module_id` | Certifications |
| `regulatory_alert_viewed` | Symfony | US-11 | `text_id`, `theme` | Usage de la veille |
| `feedback_submitted` | Symfony | formulaire de retours | `category` | Retours (BI admin) |

## 3. Indicateurs du tableau de bord client (fonctionnalité 6)

Tous filtrés par organisation (testé : une organisation ne voit jamais les chiffres d'une autre).

| Indicateur | Définition | Source |
|---|---|---|
| Score global et par pilier | scores du dernier diagnostic validé | `app.score` |
| Évolution du score | global du dernier diagnostic − global du précédent | `app.score` (US-10) |
| Actions par statut | décompte `todo`, `in_progress`, `in_review`, `done` | `app.action` |
| Actions en retard | non terminées, échéance < aujourd'hui | `app.action` (US-06) |
| Actions à échéance proche | non terminées, échéance dans les **14 jours** (paramètre `due_soon_days`, seuil à valider) | `app.action` (US-06) |
| Taux de réalisation | actions terminées / actions | `app.action` |
| Taux de complétion des formations | inscriptions terminées / inscriptions | `app.enrollment` |
| Part des collaborateurs formés | collaborateurs ayant terminé au moins un module / membres | `app.enrollment`, `app.membership` |
| Score moyen aux quiz | moyenne des modules terminés | `app.enrollment` |
| Certificats délivrés | décompte | `app.certificate` |
| Documents de preuve | nombre, date du dernier dépôt | `app.document` |
| Alertes réglementaires non lues | décompte | `app.regulatory_alert` |

Exemple de réponse : voir la documentation interactive du service (`/docs`) ou
`tests/test_indicators_quality_api.py::test_indicateurs_d_une_organisation`.

## 4. Points à valider

- [ ] Seuil « échéance proche » (US-06 : « seuil à définir ») : 14 jours proposés
- [ ] Émission côté serveur des événements métier (Symfony) : effort côté devs
- [ ] Outil d'analytics du site vitrine (avec ou sans consentement)
