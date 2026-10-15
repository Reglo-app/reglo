# Reglo — BI d'administration : récapitulatif des fonctionnalités data

> Version : v0.1 · Base : tableau de bord admin du projet « carnet de voiture » (déjà développé), à transposer en squelette modulable pour le SaaS Reglo.
> Alimente : dossier individuel DATA (Spécifications, Plateforme data, Dashboards) + dossier technique commun.
> Statut des éléments : ✅ existant (carnet auto) · 🔁 à adapter pour Reglo · 🆕 nouveau pour Reglo · ❓ à valider

---

## 1. Principe : un socle générique + une couche métier

Le BI admin est découpé en **modules indépendants (un par onglet)**. Chaque module ne dépend que :
1. d'un **contrat d'événements** commun (ce que l'application doit émettre, cf. §4) ;
2. d'une **configuration métier** (noms des objets, étapes de l'entonnoir, quotas, seuils).

Ainsi, brancher le BI sur le SaaS Reglo final = émettre les événements du contrat + remplir la configuration, sans réécrire les modules (« plug and play »).

| Couche | Contenu | Réutilisable tel quel ? |
|---|---|---|
| Socle | Sessions, erreurs, performances, retours, connexions, utilisateurs, versions | Oui |
| Métier | Objets suivis (véhicules → entreprises, formations…), entonnoir, contenu, quotas | Non → configuration |

### Éléments transverses (tous onglets)
- ✅ **Bandeau de fraîcheur** : « Données du JJ/MM HH:MM · N comptes · connexions sur 90 jours, erreurs sur 30 jours »
- ✅ **Bouton Actualiser** (recalcul à la demande)
- ✅ **« Voir les données »** sous chaque graphique : tableau équivalent (accessibilité RGAA, lecture sans le graphique)
- ✅ Accès **réservé aux administrateurs** (rôle `admin`)

### Définitions communes
| Terme | Définition |
|---|---|
| Session | Ouverture de l'app ; une nouvelle session est comptée au plus toutes les **30 minutes** par compte |
| Compte actif (période) | A ouvert au moins une session sur la période |
| Inactif | Aucune connexion depuis **30 jours** |
| En ligne | Activité depuis moins de **30 minutes** |
| Engagement répété | Venu au moins **2 jours différents sur 30 jours** |
| Compte fantôme | Inscrit depuis plus de 90 jours **et** (aucun objet métier saisi **ou** aucune connexion depuis 90 jours) |

❓ Seuils à confirmer pour Reglo (usage B2B : plutôt hebdomadaire, en jours ouvrés).

---

## 2. Les onglets

### 2.1 Vue d'ensemble ✅

**Objectif** : en un coup d'œil, savoir s'il y a quelque chose à traiter.

**Points d'attention** (triés du plus urgent au moins urgent, badge « À SURVEILLER », lien d'action) :
| Règle | Exemple de message | Action |
|---|---|---|
| Erreurs sur les dernières 24 h > 0 | « 10 erreurs dans les dernières 24 h » + dernier message d'erreur | Voir les erreurs → Santé du système |
| Retour sans réponse depuis > 7 jours | « 1 retour sans réponse depuis plus de 7 jours » | Traiter les retours → Retours |

**L'essentiel (KPI)** :
| KPI | Calcul | Fenêtre |
|---|---|---|
| Actifs | Comptes distincts avec session / total comptes | 7 j |
| Sessions | Nombre de sessions | 7 j |
| Erreurs | Nombre d'erreurs (+ dont 24 h) | 7 j |
| Retours à traiter | Retours au statut ouvert | — |
| Stockage | Volume total stocké / quota | — |

🔁 Reglo : ajouter des règles d'alerte métier, par exemple pipeline de veille en échec, alerte réglementaire non envoyée, formation avec taux d'échec anormal ❓.

---

### 2.2 Santé du système ✅

**Objectif** : stabilité et performance de l'application.

| KPI | Calcul | Fenêtre |
|---|---|---|
| Erreurs (24 h) / (7 jours) | Nombre d'événements `error` | 24 h / 7 j |
| Erreurs par session | Sessions avec ≥ 1 erreur / sessions | 7 j |
| Chargement médian | Médiane du temps d'ouverture de l'app | 7 j |
| Chargement p95 | 95e centile du temps d'ouverture | 7 j |

**Visualisations** :
- Erreurs par jour (barres, 30 j) + total et nombre d'erreurs **distinctes**
- Versions en circulation (7 j) : répartition des sessions par version (hash de commit / `local`)
- Navigateurs, Appareils (mobile / ordinateur) : répartition des sessions
- Dernières erreurs : message, nb d'occurrences, nb de comptes touchés, page, navigateur, version, type (ex. promesse rejetée), horodatage

🔁 Reglo : ajouter la santé de la **plateforme data** (durée et statut des runs de pipeline, tests qualité dbt en échec, fraîcheur des tables) ❓ — soit dans cet onglet, soit dans un onglet « Data » dédié.

---

### 2.3 Adoption ✅ 🔁

**Objectif** : les utilisateurs s'approprient-ils le produit ?

| KPI | Calcul |
|---|---|
| Comptes | Total des comptes |
| Actifs (7 j) / Actifs (30 j) | Comptes avec session sur la période (+ % du total) |
| Inactifs | Aucune connexion depuis 30 j |
| Nouveaux comptes (30 j) | Comptes créés sur 30 j |
| Engagement répété | % de comptes venus ≥ 2 jours distincts sur 30 j |

**Visualisations** :
- Utilisateurs actifs par jour (30 j)
- **Entonnoir d'adoption** : comptes ayant franchi chaque étape **et** les précédentes, en nombre, en % et en perte d'une étape à l'autre
- Fonctionnalités utilisées : par page, nombre de comptes et de sessions
- Utilisateurs les plus actifs : nom, sessions (90 j), actions, dernière connexion
- Comptes fantômes : nom, email, créé le, dernière connexion, raison (pour relance)

**Entonnoir — transposition** 🔁 :
| Étape | Carnet auto ✅ | Reglo ❓ (à définir avec l'équipe) |
|---|---|---|
| 1 | Inscription | Inscription |
| 2 | Véhicule ajouté | Profil entreprise complété (secteur NAF, effectif) |
| 3 | Entretien enregistré | Première formation commencée / premier module utilisé |
| 4 | Plein enregistré | Formation terminée / alerte de veille consultée |
| 5 | Revenu après 7 jours | Revenu après 7 jours |
| 6 | — | Passage à l'abonnement payant 🆕 |

---

### 2.4 Contenu ✅ 🔁

**Objectif** : volume et répartition des contenus stockés par les utilisateurs.

| KPI | Calcul |
|---|---|
| Stockage des documents | Volume total / quota (ex. 1 Go gratuit) |
| Documents stockés | Total + nb de comptes concernés |
| Documents par compte | Moyenne sur tous les comptes |
| Objets métier | Carnet auto : véhicules (+ moyenne par compte) |
| Erreurs documents (30 j) | Erreurs sur les pages Documents / Scanner |

**Visualisations** :
- Comptes par nombre de documents (classes : 0 · 1-2 · 3-5 · 6-10 · plus de 10)
- Comptes qui stockent le plus
- Note de méthode : tailles mesurées à l'ajout et à la suppression de chaque document

🔁 Reglo ❓ : documents QHSE (DUERP, procédures, attestations de formation, rapports d'audit) ; objets métier = entreprises / sites / salariés suivis ; ajouter la consommation des **contenus Reglo** (articles lus, formations du catalogue suivies) 🆕.

---

### 2.5 Retours ✅

**Objectif** : traiter la voix de l'utilisateur.

| KPI | Calcul |
|---|---|
| Total des retours | Nombre de retours |
| Bugs signalés | Retours catégorie « Bug » |
| Demandes de fonctionnalités | Retours catégorie « Nouvelle fonctionnalité » |
| À traiter | Retours au statut ouvert |

**Visualisations** :
- Retours par catégorie (Bug, Amélioration, Nouvelle fonctionnalité, Autre)
- Soumissions par jour (30 j)
- Table des demandes : date, catégorie, titre, auteur, statut (Reçu → …) ; filtres catégorie et statut

🔁 Reglo : sert directement le **plan d'amélioration continue** (minimum UX à assurer) — lien à faire avec l'équipe ❓.

---

### 2.6 Connexions ✅

**Objectif** : quand et d'où les utilisateurs se connectent.

- Sélecteur de période : 7 / 30 / 90 jours

| KPI | Calcul |
|---|---|
| Sessions | Nombre de sessions (+ comptes distincts) |
| Sessions localisées | % des sessions avec **consentement « localisation »** |
| Heure de pointe | Heure avec le plus de sessions |
| Jour le plus actif | Jour de la semaine avec le plus de sessions |

**Visualisations** :
- Carte des connexions (Leaflet + OpenStreetMap) : position **approximative (~10 km) déduite de l'IP**, uniquement pour les sessions ayant consenti ; cercles proportionnels au nombre de sessions
- Heatmap jour × heure

⚠️ RGPD : géolocalisation IP = donnée personnelle → consentement, précision dégradée, IP brute non conservée ❓ (à documenter dans le registre).

---

### 2.7 Utilisateurs ✅

**Objectif** : gérer les comptes.

- Recherche par nom ou email, filtre par statut, tri (ex. dernière connexion)
- Compteur « en ligne » (< 30 min)
- **Export CSV**
- Table : nom, email, rôle (Admin / Utilisateur), statut (Actif / Jamais connecté / Inactif), créé le, dernière connexion, nb de connexions, nb d'objets métier, nb et taille des documents
- Action : **Suspendre** un compte

🔁 Reglo : B2B → ajouter l'**entreprise** de rattachement, le rôle dans l'entreprise (responsable QHSE / salarié), le plan d'abonnement 🆕.
⚠️ RGPD : export CSV de données personnelles → traçabilité des exports, accès admin uniquement.

---

### 2.8 Nouveautés ✅

**Objectif** : publier les notes de version visibles par les utilisateurs.

- Formulaire « Publier une version » : version (hash de commit), date, titre, nouvelles fonctionnalités, améliorations, corrections (une ligne par élément, sections vides masquées)
- Liste des versions publiées : titre, version, compteurs (nouveautés / améliorations / corrections), modifier, supprimer

🔁 Reglo : à relier à la CI/CD (version = commit déployé) ❓.

---

## 3. Modules à ajouter pour Reglo 🆕 ❓

| Module | Contenu envisagé | Lien grille DATA |
|---|---|---|
| Veille réglementaire | Textes collectés par jour et par source, classification par thème, alertes envoyées / ouvertes, statut des runs | Automatisation + IA |
| Formations | Inscriptions, complétion, scores, temps passé, attestations délivrées | Plateforme analytique |
| Business | Abonnements, MRR, churn, conversion site → essai → payant (avec l'EMD) | Plateforme analytique |
| Data / qualité | Fraîcheur des tables, tests qualité, volumes traités, temps de traitement | Tests, déploiement |

À distinguer : **BI admin Reglo** (équipe interne, ce document) vs **dashboards clients** dans le SaaS (responsable QHSE, données de son entreprise uniquement) ❓.

---

## 4. Contrat d'événements (à valider avec les DFS)

Socle minimum pour que les modules fonctionnent sans modification :

| Événement / table | Champs principaux | Modules |
|---|---|---|
| `users` | id, nom, email, rôle, statut, created_at, (entreprise_id 🆕) | Utilisateurs, Adoption |
| `sessions` | id, user_id, started_at, version, navigateur, appareil, temps_chargement_ms, (localisation approx. si consentement) | Santé, Adoption, Connexions |
| `page_views` | session_id, user_id, page, at | Adoption (fonctionnalités utilisées) |
| `errors` | message, type, page, version, navigateur, user_id, at | Santé, Vue d'ensemble |
| `feedback` | id, user_id, catégorie, titre, statut, created_at | Retours, Vue d'ensemble |
| `documents` | id, user_id, taille_octets, type, created_at, deleted_at | Contenu |
| `releases` | version, date, titre, nouveautés[], améliorations[], corrections[] | Nouveautés, Santé |
| `business_events` 🔁 | user_id, type (étape d'entonnoir), at | Adoption (entonnoir) |

---

## 5. Points à trancher (par moi / l'équipe)
- [ ] Stack du BI Reglo : reprendre le code du carnet auto (stack : ❓) ou passer par l'entrepôt analytique + outil BI ?
- [ ] Calcul des indicateurs : côté application (requêtes directes) ou côté plateforme data (dbt + tables agrégées) ?
- [ ] Seuils et définitions adaptés au B2B
- [ ] Étapes de l'entonnoir Reglo
- [ ] Périmètre BI admin vs dashboards clients
- [ ] Mentions RGPD : géolocalisation, export CSV, durées de conservation des logs
