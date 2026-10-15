# Réglo — Modèle de données partagé (dictionnaire)

> **Statut : proposition à valider avec les devs** (carte « Modèle de données partagé avec les devs »).
> Schéma SQL de référence : `../service/sql/001_schemas_postgres.sql`. Diagramme : note de cadrage (§4).
> Ce sont les migrations Doctrine des devs qui feront foi pour le schéma `app`.

## Propriété des schémas

| Schéma | Propriétaire | Accès du service data | Contenu |
|---|---|---|---|
| `app` | API Symfony (Doctrine) | **lecture seule** | organisations, utilisateurs, diagnostic, scores, actions, documents, formations |
| `veille` | service data | lecture / écriture | textes réglementaires, journal des collectes |
| `analytics` | service data | lecture / écriture | événements produit |

## Tables `app`

| Table | Rôle | Colonnes clés | Règles |
|---|---|---|---|
| `organization` | Entreprise cliente (tenant) | `id`, `name`, `naf_code`, `size_band` | `naf_code` sert au ciblage de la veille |
| `app_user` | Compte | `email` (unique), `password_hash` | mot de passe haché (US-02) |
| `membership` | Rôle d'un utilisateur dans une organisation | `organization_id`, `user_id`, `role` | rôles `owner`, `manager`, `member` |
| `questionnaire_version` | Questionnaire publié | `version`, `definition` (JSON) | une version publiée n'est plus modifiée |
| `diagnostic` | Auto-évaluation | `organization_id`, `questionnaire_version`, `status`, `validated_at` | `validated` ⇒ `validated_at` renseigné |
| `answer` | Réponse à une question | `diagnostic_id`, `question_id`, `value`, `not_applicable`, `justification` | sauvegarde automatique (US-03) |
| `score` | Résultat du calcul | `diagnostic_id`, `scope`, `key`, `value`, `algo_version` | 0 ≤ `value` ≤ 100 ; produit par le service data |
| `action` | Plan d'actions | `organization_id`, `owner_id`, `due_date`, `status`, `source_question_id` | statuts `todo`, `in_progress`, `in_review`, `done` (US-05) |
| `document` | Preuve | `organization_id`, `sha256`, `mime`, `size_bytes`, `action_id` / `question_id` | ≤ 20 Mo, formats autorisés (US-07) |
| `training_module` | Module de formation | `title`, `theme`, `free` | `free` = offre « Découverte » (US-08) |
| `enrollment` | Suivi d'un module | `user_id`, `module_id`, `organization_id`, `progress`, `quiz_score` | 0 ≤ `progress` ≤ 1 |
| `certificate` | Certificat délivré | `verification_code` (unique) | vérifiable par un tiers |
| `regulatory_alert` | Alerte de veille | `organization_id`, `text_id`, `read_at` | non lue si `read_at` vide |

## Tables du service data

| Table | Rôle | Colonnes clés |
|---|---|---|
| `veille.regulatory_text` | Texte réglementaire collecté | `id` (JORFTEXT… / celex-…), `source`, `nature`, `reference`, `title`, `published_at`, `url`, `themes`, `naf_scope` |
| `veille.collection_run` | Journal des collectes | `source`, `started_at`, `ok`, `read`, `kept`, `excluded_personal`, `error` |
| `analytics.event` | Événement produit | `name`, `occurred_at`, `organization_id`, `user_id`, `session_id`, `properties` |

## Choix structurants (à valider)

1. **Identifiants UUID** : pas d'identifiant séquentiel devinable dans les URL.
2. **Scores dans `app`** : l'API enregistre ce que renvoie le service data ; une seule source de vérité.
3. **Thèmes en JSON + index GIN** : les filtres de l'US-11 restent rapides en PostgreSQL
   (sous SQLite, la lecture filtrée de 50 000 textes prend environ 94 ms, cf. `bench-resultats.md`).
4. **Suppression en cascade** à la suppression d'une organisation (droit à l'effacement, fin de contrat).
