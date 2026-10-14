# Reglo — Note de cadrage de la stratégie data

> Version : v0.1 (trame) · Auteur : [Alexis CLOAREC] · Date : [12/10/2026]
> Alimente : dossier individuel DATA, section « Spécifications » (grille Conception /12)
>
> ⚠️ Règle IA : les parties marquées **[À COMPLÉTER]** (choix, arbitrages, justifications, interprétations) doivent être rédigées par moi — niveau 1 « aucune utilisation ».

---

## 1. Contexte

### 1.1 Reglo en une phrase
[Notre ambition : rendre la RSE et la QHSE accessibles, concrètes et valorisantes pour toutes les entreprises, quelle que soit leur taille.
L'idée centrale : Réglo ne vendrait pas seulement un logiciel ou une prestation de conseil, mais un accompagnement qui relie diagnostic, action, formation et preuve.
Attention à une distinction essentielle pour votre projet : Réglo peut accompagner ses clients vers une certification reconnue, mais cela ne signifie pas automatiquement que Réglo délivre lui-même cette certification. Les certifications doivent être délivrées par les organismes compétents, selon les règles applicables.]

### 1.2 Le problème côté utilisateur [à traiter ultérieurement pas besoin pour linstant]
Questions à traiter (s'appuyer sur les interviews de responsables QHSE) : 
- Combien de temps passent-ils sur la veille réglementaire ? Avec quels outils aujourd'hui ?
- Comment prouvent-ils la formation de leurs salariés (obligation employeur) ?
- Comment produisent-ils leurs indicateurs (AT, plan d'actions, audits) ? Excel ? Logiciel ?
- Quelles obligations récentes les inquiètent (CSRD, DUERP, ISO 45001/14001/9001…) ?

[À COMPLÉTER — synthèse des réponses + verbatims]

### 1.3 Positionnement data du produit
Choisir et justifier le positionnement :
- **Produit data-centric** : la donnée (veille, indicateurs) EST la valeur vendue
- **Développement data-driven** : la donnée sert à piloter la startup (acquisition, rétention, usage)


---

## 2. Objectifs de la stratégie data

Formuler 3 à 5 objectifs **SMART**, par exemple sur ces axes :

| Axe | Question guide | Objectif SMART |
|---|---|---|
| Valeur client | Quelle donnée fait gagner du temps / réduit un risque pour le responsable QHSE ? | [À COMPLÉTER] |
| Produit | Quelle fonctionnalité SaaS repose sur la data / l'IA ? | [À COMPLÉTER] |
| Pilotage startup | Quels KPI business l'équipe doit-elle suivre (avec l'EMD) ? | [À COMPLÉTER] |
| Qualité | Quel niveau de qualité de donnée est acceptable (fraîcheur, complétude) ? | [À COMPLÉTER] |
| Conformité | Quel niveau de conformité RGPD / IA Act viser au lancement ? | [À COMPLÉTER] |

---

## 3. Cas d'usage data

Pour chaque cas d'usage : utilisateur, besoin, données, traitement, restitution, priorité (MoSCoW), faisabilité d'ici le 12/02/2027.

| # | Cas d'usage | Utilisateur | Données | Traitement | Restitution | Priorité | Faisabilité |
|---|---|---|---|---|---|---|---|
| UC1 | Veille réglementaire automatisée (collecte, classification par thème, résumé, alerte selon secteur) | Resp. QHSE | Textes réglementaires, profil entreprise (NAF, effectif) | Ingestion, NLP/LLM, matching | Fil d'alertes dans le SaaS, email | [À COMPLÉTER] | [À COMPLÉTER] |
| UC2 | Dashboards QHSE clients (AT, TF/TG, plan d'actions) | Resp. QHSE, direction | Données saisies par le client | Agrégations, indicateurs | Dashboard embarqué | [À COMPLÉTER] | [À COMPLÉTER] |
| UC3 | Suivi des formations (complétion, scores, attestations) | Resp. QHSE | Événements de la plateforme | Agrégations par salarié/équipe | Dashboard + export | [À COMPLÉTER] | [À COMPLÉTER] |
| UC4 | Pilotage business interne (funnel site → SaaS, MRR, churn, contenus) | Équipe Reglo | Analytics site, BDD app, paiements | Modélisation funnel | Dashboard interne | [À COMPLÉTER] | [À COMPLÉTER] |
| UC5 | Analyse du marché (taille, secteurs prioritaires) | Équipe Reglo (BP) | SIRENE, sinistralité AT/MP, offres d'emploi | Analyse exploratoire | Graphiques du business plan | [À COMPLÉTER] | [À COMPLÉTER] |

**Arbitrage du périmètre MVP** : [À COMPLÉTER — quels UC je retiens, lesquels j'écarte et pourquoi]

---

## 4. Inventaire des sources de données

> Licences et conditions d'accès à **vérifier moi-même** avant usage (critère « réglementation »).

| Source | Contenu | Accès | Licence / conditions | Fréquence | Pour quel UC |
|---|---|---|---|---|---|
| Légifrance (API via portail PISTE) | Codes (travail, environnement), JORF | API, inscription PISTE | Licence Ouverte Etalab (à confirmer) | Quotidienne | UC1 |
| EUR-Lex | Règlements et directives UE | Web services / SPARQL (Cellar) | Réutilisation autorisée avec mention (à confirmer) | Quotidienne | UC1 |
| INRS | Publications prévention, fiches | Site web | **Droits à vérifier** (pas forcément open data) | Hebdo | UC1 |
| Base SIRENE (INSEE) | Entreprises, NAF, tranches d'effectif | API SIRENE / fichiers stock | Licence Ouverte | Mensuelle | UC5, profils clients |
| Assurance Maladie (risques professionnels) | Statistiques de sinistralité AT/MP par secteur | Fichiers open data | À vérifier | Annuelle | UC5, benchmark UC2 |
| France Travail (API offres) | Offres « responsable QHSE/HSE » | API, inscription | Conditions API | Hebdo | UC5 |
| BDD application (DFS) | Utilisateurs, entreprises, formations, événements | Accès lecture seule (à négocier) | Données personnelles → RGPD | Temps réel / horaire | UC2, UC3, UC4 |
| Analytics site (EMD) | Trafic, conversions | Outil à choisir (Matomo / Plausible / …) | Consentement cookies | Quotidienne | UC4 |

[À COMPLÉTER — sources retenues / écartées + justification]

---

## 5. Données personnelles et risques (pré-analyse)

| Donnée | Personnes concernées | Sensibilité | Point d'attention |
|---|---|---|---|
| Comptes utilisateurs | Clients (resp. QHSE) | Standard | Base légale : contrat |
| Résultats de formation | Salariés des clients | Standard, mais évaluation de personnes | Reglo = sous-traitant du client (art. 28) ? |
| Déclarations d'accidents du travail | Salariés des clients | **Potentiellement données de santé (art. 9)** | Minimisation, pseudonymisation, AIPD probable |
| Analytics site | Visiteurs | Standard | Consentement cookies |

Questions à trancher :
- Reglo est-il **responsable de traitement** ou **sous-traitant** pour les données saisies par les clients ? [À COMPLÉTER]
- Faut-il stocker des données nominatives d'accidents, ou seulement des agrégats ? [À COMPLÉTER]
- Classification IA Act de la brique IA retenue (risque minimal / transparence) ? [À COMPLÉTER]

---

## 6. Principes d'architecture (avant les choix technos)

Exigences à respecter, qui guideront la veille techno :
- Hébergement sur le **VPS école** (ressources limitées → sobriété)
- Données hébergées en **UE**
- Séparation **base applicative** / **base analytique**
- Cloisonnement des données **par client** (multi-tenant)
- Pipelines **reproductibles et testés** (CI/CD)
- Scalabilité démontrable (tests volume vs temps de traitement)

[À COMPLÉTER — exigences supplémentaires, priorisation]

---

## 7. Indicateurs de succès de la stratégie data

| Indicateur | Cible | Mesure |
|---|---|---|
| Fraîcheur de la veille (délai publication → alerte) | [À COMPLÉTER] | Logs pipeline |
| Précision de la classification IA | [À COMPLÉTER] | Jeu de test annoté |
| Taux de tests dbt / qualité passés | [À COMPLÉTER] | CI |
| Temps de traitement à 100k / 1M lignes | [À COMPLÉTER] | Benchmark |
| Usage des dashboards par les clients | [À COMPLÉTER] | Analytics produit |

---

## 8. Organisation et dépendances

| Avec | Besoin | Échéance |
|---|---|---|
| DFS | Schéma BDD, accès lecture seule, tracking d'événements, API d'alertes | [À COMPLÉTER] |
| CAR | Accès VPS, conteneurs, secrets, sauvegardes | [À COMPLÉTER] |
| EMD | KPI marketing, outil analytics | [À COMPLÉTER] |
| DAD | Charte pour les dashboards | [À COMPLÉTER] |

---

## 9. Risques et parades

| Risque | Impact | Parade |
|---|---|---|
| VPS sous-dimensionné (LLM, orchestrateur, BI en parallèle) | Élevé | [À COMPLÉTER] |
| Licence d'une source incompatible | Moyen | [À COMPLÉTER] |
| Retard des DFS sur la BDD → pas de données réelles | Élevé | Données synthétiques (Faker) en attendant |
| Données de santé mal gérées | Élevé | [À COMPLÉTER] |
| [À COMPLÉTER] | | |

---

## 10. Prochaines étapes
- [ ] Compléter les sections [À COMPLÉTER]
- [ ] Valider le périmètre MVP avec l'équipe
- [ ] Lancer la veille technologique (tableaux comparatifs)
- [ ] Rédiger les spécifications techniques data
