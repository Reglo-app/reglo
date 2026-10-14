# BI admin Reglo · trame à intégrer

> **Pour : Quentin (DFS) et son assistant IA.**
> **De : Alexis (Data).**
> **Statut : trame / prototype. Ce n'est PAS un module prêt pour la production.**

## 1. Ce que c'est

Une **maquette fonctionnelle du tableau de bord d'administration** de Reglo (8 onglets : Vue d'ensemble,
Santé du système, Adoption, Contenu, Retours, Connexions, Utilisateurs, Nouveautés).

- Développée **en local, sur des données fictives** générées (`src/datasources/mock/`).
- Sert à **figer les indicateurs, leurs définitions et les données à collecter** avant l'intégration.
- Stack de la maquette : React 18 + TypeScript + Vite, Recharts, Leaflet. **Ce n'est pas une
  contrainte** : la stack finale est celle du SaaS, c'est toi qui décides.

Lancer la maquette :
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests unitaires des indicateurs
```

## 2. Ce qu'il faut garder vs adapter

| Élément | Fichiers | À faire |
|---|---|---|
| **Définitions et calculs des indicateurs** | `src/core/metrics/*.ts` + `metrics.test.ts` | **Garder la logique** (c'est la spécification testée). Les réimplémenter en SQL / côté serveur si besoin, en gardant les mêmes résultats sur les cas de test. |
| **Contrat de données** | `src/core/contract.ts` | **Référence des données à collecter** (§3). Les noms de champs peuvent changer, pas le sens. |
| **Configuration métier** | `src/config/reglo.config.ts` | Seuils, étapes d'entonnoir, libellés de pages : à valider ensemble. |
| **Interface (look)** | `src/styles.css`, `src/ui/`, `src/modules/*.tsx` | **À refaire avec la charte graphique Reglo** (DA) et le design system du SaaS. La maquette n'a qu'un thème neutre provisoire. |
| **Données fictives** | `src/datasources/mock/` | **Ne pas embarquer en production.** Utile pour les tests et les démos. |
| **Branchement API** | `src/datasources/http/httpDataSource.ts` | Exemple de routes : à remplacer par l'API réelle du SaaS. |

### Charte graphique
- Toutes les couleurs, rayons et ombres sont des **variables CSS** en tête de `src/styles.css` (`:root`).
  Remplacer leurs valeurs par la charte Reglo suffit pour un premier alignement.
- Polices, icônes, composants (boutons, cartes, tableaux, onglets) → utiliser ceux du design system du SaaS.
- Garder les éléments d'accessibilité : bloc « Voir les données » sous chaque graphique (tableau
  équivalent), libellés `aria-*`, focus visible, contrastes.

## 3. Les données à collecter dans le SaaS

C'est **le point le plus important** : sans ces événements, le BI ne peut rien afficher.
Détail des champs : `src/core/contract.ts`.

| Donnée | Quand l'émettre | Sert à |
|---|---|---|
| `users` (+ `companyId`) | Création / modification de compte | Utilisateurs, Adoption |
| `companies` (nom, code NAF, offre) | Création du profil entreprise | Utilisateurs, segmentation |
| `sessions` | Ouverture de l'app (**au plus 1 nouvelle session toutes les 30 min par compte**) avec version déployée, navigateur, appareil, temps de chargement | Santé, Adoption, Connexions |
| `sessions.location` | **Uniquement si consentement « localisation »**, position dégradée à ~10 km, IP brute non conservée | Connexions (carte) |
| `pageViews` | Changement de page / route | Fonctionnalités utilisées |
| `errors` | Erreurs front non gérées (exceptions, promesses rejetées, échecs réseau) avec page, version, session | Santé, Vue d'ensemble |
| `feedback` | Formulaire de retours utilisateur (catégorie, titre, statut, date de 1re réponse) | Retours |
| `documents` | Ajout / suppression de document (taille en octets) | Contenu |
| `releases` | Publication d'une version (idéalement depuis la CI/CD : version = commit déployé) | Nouveautés, Santé |
| `businessEvents` | Actions métier clés : `company_profile_completed`, `training_started`, `training_completed`, `regulatory_alert_viewed`, `subscription_started` | Entonnoir, objets suivis |

Les types d'événements métier sont des **propositions** : à ajuster selon les fonctionnalités réelles
du SaaS (et à reporter dans `reglo.config.ts`).

## 4. Contraintes à respecter à l'intégration

- **Accès admin uniquement, contrôlé côté serveur** (pas seulement masqué dans le front).
- **Multi-tenant** : le BI admin voit tout ; les futurs dashboards clients ne doivent voir que les données de leur entreprise.
- **RGPD** :
  - géolocalisation seulement avec consentement ;
  - export CSV de données personnelles réservé aux admins et tracé ;
  - durées de conservation des logs (sessions, erreurs, pages vues) à définir avec la Data ;
  - aucune donnée de santé (accidents du travail) dans ce BI.
- **Performance** : la maquette calcule tout **dans le navigateur à partir des données brutes**.
  En production, calculer côté serveur / plateforme data et renvoyer des **agrégats**.
- **Pas de secrets** dans le code (aucun n'est présent dans cette archive).

## 5. Limites connues de la maquette

- Bundle ~700 Ko (Recharts + Leaflet) → découper par onglet (`React.lazy`).
- Recharts 2.x n'est plus maintenu (avertissements `defaultProps` en console) → passer en v3 ou utiliser la lib de graphiques du SaaS.
- Animations des graphiques désactivées volontairement (rendu incomplet sinon).
- Actions admin (suspendre, statut d'un retour, publier une version) ne fonctionnent qu'en mémoire avec la source fictive.

## 6. Documentation associée

- `docs/02-bi-admin-fonctionnalites.md` : détail fonctionnel de chaque onglet (indicateurs, définitions, adaptations Reglo, points RGPD).
- `README.md` : architecture du code et ajout d'un onglet.

## 7. Contact

Questions sur les indicateurs, les définitions ou les données : **Alexis (Data)**.
Les choix de stack, d'intégration et d'interface sont côté **DFS / DA**.
