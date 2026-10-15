# Reglo · BI d'administration

Tableau de bord admin de Reglo, développé en local sur des données fictives, prêt à être branché sur le SaaS.
Fonctionnalités détaillées : [`../docs/02-bi-admin-fonctionnalites.md`](../docs/02-bi-admin-fonctionnalites.md).

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173 (données fictives)
npm test           # tests unitaires des indicateurs
npm run build      # typage + build de production
```

## Architecture

```
src/
├── core/                    ← indépendant de toute stack
│   ├── contract.ts          Contrat de données : ce que l'app doit fournir
│   ├── datasource.ts        Interface DataSource (load + actions admin)
│   ├── config.ts            Type de la configuration métier
│   └── metrics/             Calcul des indicateurs (fonctions pures, testées)
├── config/reglo.config.ts   Couche métier Reglo (entonnoir, seuils, libellés)
├── datasources/
│   ├── mock/                Générateur de données fictives (déterministe)
│   └── http/                Branchement sur l'API Reglo
├── modules/                 Un composant par onglet + registry.ts
└── ui/                      Composants et formats partagés
```

Principe : **les onglets ne connaissent ni la base, ni l'API**. Ils reçoivent un `Dataset` conforme
à `core/contract.ts` et une `BiConfig`. Changer de produit ou de source = changer la config ou la source,
pas les modules.

## Brancher sur le SaaS (pour les DFS)

1. **Exposer l'API** décrite dans `src/datasources/http/httpDataSource.ts`
   (`GET /dataset` + 4 routes d'action), réservée au rôle admin **côté serveur**.
2. **Émettre les événements** du contrat (`core/contract.ts`) : sessions, pages vues, erreurs,
   retours, documents, versions, événements métier (types listés dans `config/reglo.config.ts`).
3. **Basculer la source** dans `.env.local` :
   ```
   VITE_BI_SOURCE=http
   VITE_BI_API_URL=/api/admin/bi
   ```
4. **Ou intégrer les modules** dans le front du SaaS : copier `core/`, `modules/`, `ui/`, `config/`,
   et fournir une implémentation de `DataSource`.

## Ajouter un onglet

1. Calcul dans `core/metrics/<nom>.ts` + tests dans `metrics.test.ts`
2. Composant `modules/<Nom>.tsx` (props : `ModuleProps`)
3. Déclaration dans `modules/registry.ts` et `ModuleId` (`core/config.ts`)
4. Activation dans `config/reglo.config.ts` → `modules`

## Limites connues / suites

- Les indicateurs sont calculés **côté navigateur** à partir des données brutes : adapté au prototype.
  À volume réel, déplacer les calculs dans la plateforme data (tables agrégées) et faire renvoyer
  à `/dataset` des agrégats. Les fonctions de `core/metrics` servent alors de spécification testée.
- Bundle de ~700 Ko (Recharts + Leaflet) : découper par onglet (`React.lazy`) à l'intégration.
- Recharts 2.x n'est plus maintenu : prévoir la montée en v3.
- Thème : jetons CSS dans `styles.css` (`:root`), à aligner sur la charte Reglo.
- RGPD : géolocalisation uniquement avec consentement, export CSV de données personnelles à tracer.
