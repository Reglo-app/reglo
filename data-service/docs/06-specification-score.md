# Réglo — Spécification du calcul de score du diagnostic

> **Statut : spécification v1 + prototype testé** (carte « Spécification du calcul de score »).
> Code : `../service/reglo_data/scoring.py` · tests : `../service/tests/test_scoring.py` (18 scénarios).
> **Le questionnaire utilisé est fictif** (`questionnaire_example.json`) : le contenu réel (questions,
> pondérations, seuils de maturité) est à produire avec l'expertise QHSE / Business et à valider en équipe.

## 1. Entrées et sorties

- **Entrée** : version du questionnaire + liste des réponses (`question_id`, `value`, `not_applicable`,
  `justification`, `has_document`).
- **Sortie** : score global, scores par pilier et par thématique (0 à 100, une décimale), niveau de
  maturité, taux de couverture, 3 écarts prioritaires, `algo_version`.

## 2. Notation d'une réponse (0 à 100)

| Type de question | Réponse attendue | Note |
|---|---|---|
| `yes_no` | `yes` / `no` / `partial` | 100 / 0 / 50 |
| `scale` | niveau `0 … n-1` | `100 × niveau / (n − 1)` |
| `single_choice` | identifiant d'option | points de l'option (0 à 100) |
| `multi_choice` | liste d'options | somme des points (doublons ignorés), plafonnée à 100 |
| `text` | texte libre | non noté |

## 3. Règles

1. **Non applicable** : uniquement si la question l'autorise (`allow_na`) ; la question est exclue du
   calcul (ni bonus ni pénalité). Une thématique entièrement non applicable est exclue de son pilier.
2. **Règle de preuve** : une question `requires_proof` sans justification ni document est plafonnée à
   `proof_cap` (50 par défaut). L'écart correspondant est signalé (`capped_for_proof`).
3. **Agrégation pondérée** : thématique = moyenne pondérée des questions ; pilier = moyenne pondérée des
   thématiques ; global = moyenne pondérée des piliers (Social, Environnement, Éthique, Gouvernance).
4. **Validation (US-03)** : le calcul est refusé (HTTP 422, liste des erreurs) si une question obligatoire
   est sans réponse, si une réponse est invalide ou si une question est inconnue.
5. **Écarts prioritaires** : pour chaque question notée, gain potentiel en points sur le score global si
   elle passait à 100 (= part effective de la question × (100 − note)). Les 3 plus forts sont renvoyés :
   ils servent de base aux actions proposées (plan d'actions).
6. **Maturité** (seuils proposés) : < 25 Initial, < 50 En structuration, < 75 Maîtrisé, ≥ 75 Exemplaire.
7. **Versionnage** : chaque score porte `algo_version` (1.0.0) et la version du questionnaire ; deux
   diagnostics ne se comparent qu'à versions compatibles (US-10).

## 4. Exemple

Thématique « Santé et sécurité » : S1 (poids 3) = 0, S2 (poids 2) = 100, S3 (poids 1) = 100 →
(0×3 + 100×2 + 100×1) / 6 = **50**. Pilier Social : santé-sécurité (poids 2) = 50, compétences (poids 1)
= 100 → (50×2 + 100) / 3 = **66,7**.

## 5. Contrôle des questionnaires (qualité)

`validate_questionnaire()` refuse un questionnaire avec identifiants en double, poids négatifs, échelles
de moins de 2 niveaux, options sans points entre 0 et 100 ou types inconnus.

## 6. Scénarios de test (tous passants)

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Toutes les réponses au maximum | global 100, « Exemplaire », aucun écart |
| 2 | Toutes au minimum | global 0, « Initial », 3 écarts |
| 3 | Thématique entièrement « non applicable » | thématique exclue, pilier calculé sans elle |
| 4 | « Non applicable » sur une question qui ne l'autorise pas | refus (422) |
| 5 | Question obligatoire vide | refus, question citée |
| 6 | Question texte facultative | non notée, sans effet |
| 7 | Réponse « oui » sans preuve sur une question qui en exige | note plafonnée à 50, écart signalé |
| 8 | Pondérations question / thématique / pilier | valeurs calculées à la main (§4) |
| 9 | Échelle, choix multiple avec doublon, réponse partielle | 33,33 / 60 / 50 |
| 10 | Choix multiples dépassant 100 | plafonné à 100 |
| 11-14 | Réponses invalides (niveau hors bornes, option inconnue…) | refus |
| 15 | Question inconnue | refus |
| 16 | Tri des écarts, valeur du premier | décroissant ; G2 = 16,67 points |
| 17 | Déterminisme | deux calculs identiques |
| 18 | Seuils de maturité | bornes 25 / 50 / 75 respectées |

## 7. Performance

Environ 0,05 ms par diagnostic, stable jusqu'à 10 000 diagnostics (`bench-resultats.md`).

## 8. À décider en équipe

- [ ] Contenu réel du questionnaire et pondérations (expertise QHSE)
- [ ] Valeur du plafond de preuve (50 ?) et liste des questions qui exigent une preuve
- [ ] Seuils de maturité et libellés
- [ ] Où exécuter le calcul (service data proposé) : décision d'architecture du 16 oct.
