# Réglo — Veille réglementaire de la plateforme (EPIC E07, US-11)

> **Statut : chaîne de collecte et API prêtes, testées** (carte « Veille réglementaire produit »).
> Reste à faire : affichage dans la plateforme (devs, v0.5) et alertes par organisation.
> Code : `../service/reglo_data/regulatory/` et `taxonomy.py` · route `GET /veille/texts`.

## 1. Sources

| Source | Accès | Contenu retenu |
|---|---|---|
| **Journal officiel (JORF)** | Open data DILA, archives quotidiennes, **sans clé** (Licence Ouverte) | lois, ordonnances, décrets, arrêtés, décisions, circulaires |
| **EUR-Lex** | Point d'accès SPARQL public de l'Office des publications | actes législatifs (CELEX 3…) et propositions (CELEX 5…), hors rectificatifs |
| Légifrance (API PISTE) | clés gratuites à demander | *non nécessaire pour le MVP* : l'open data DILA couvre le JO ; utile plus tard pour les textes consolidés (codes) |

## 2. Chaîne de traitement

```
Archives JORF du jour ─┐                                 ┌─ exclusion des mesures nominatives (RGPD)
                       ├─► lecture XML (métadonnées) ───►├─ natures normatives seulement
EUR-Lex (SPARQL) ──────┘                                 ├─ exclusion du bruit administratif
                                                         ├─ classement par thèmes clients
                                                         └─ ciblage sectoriel (NAF)
                                                                    │
                                    veille.regulatory_text ◄────────┘  (upsert idempotent, par lots)
                                    veille.collection_run  (journal : lus, retenus, écartés, erreurs)
                                                                    │
                                    GET /veille/texts?theme=&naf=&since=   →  API Symfony  →  US-11
```

- **Métadonnées seulement** : nature, NOR / CELEX, dates, titre, ministère, lien Légifrance ou EUR-Lex.
- **Minimisation (RGPD)** : le JO publie aussi des mesures individuelles (nominations, naturalisations,
  affectations, décorations…). Elles sont écartées **avant tout stockage** : sur 90 jours, 4 532 textes
  nominatifs écartés pour 12 210 lus.
- **Thèmes clients** (US-11) : Loi Climat, CSRD, Déchets, Social (santé-sécurité incluse). Classement
  par expressions sur le titre : explicable, sans IA, réglable (`taxonomy.py`).
- **Ciblage NAF** : un texte qui vise un secteur (BTP, transport, ICPE…) porte les sections NAF
  concernées ; les autres s'adressent à tous. Le filtre `naf` de l'API garde les textes du secteur et
  les textes généraux.
- **Automatisation** : `python -m reglo_data collect --days 2` chaque jour (cron du conteneur data).

## 3. Résultats (collecte réelle, 90 jours, 13 oct. 2026)

| Étape | Volume |
|---|---|
| Textes lus dans les archives JO | 12 210 |
| Mesures nominatives écartées | 4 532 |
| Textes retenus (thèmes clients) | 64 (Social 29, Loi Climat 20, Déchets 15) |
| … dont ciblés sur un secteur | 22 |
| EUR-Lex | 8 à 10 actes retenus selon les jours (point d'accès parfois lent : seconde tentative automatique) |

Exemples retenus : décrets du 24 sept. 2026 sur le diagnostic des maladies professionnelles, arrêté sur
les cotisations AT des entreprises, cahiers des charges des éco-organismes, critères de sortie du statut
de déchet, panneaux photovoltaïques, pompes à chaleur, règlements UE sur les normes de durabilité.

## 4. Améliorations apportées pendant la mise au point

| Problème constaté | Correction |
|---|---|
| Les archives contiennent des versions modifiées de textes anciens (lois de 1991…) | filtre sur la date de publication |
| « énerg » trouvait « Radio M**energ**y », « mobilité » une prothèse médicale | motifs ancrés et plus précis |
| Mesures nominatives non couvertes (« cessation de fonction », « liste d'aptitude ») | liste complétée + tests |
| Extensions d'avenants de conventions collectives, élections, examens | liste de bruit administratif |
| Enregistrement en échec au-delà de 30 000 textes (limite SQLite) | traitement par lots de 500 (révélé par le banc de charge) |

## 5. Mesure de la qualité du classement

Échantillon de 40 textes à annoter à la main : `echantillon-veille-a-annoter.csv`
(pertinent oui/non, thèmes corrects oui/non). **Précision = textes pertinents / textes retenus.**
À faire par Alexis (interprétation = niveau 1), puis ajuster `taxonomy.py` si la précision est insuffisante.

## 6. Reste à faire

- [ ] Affichage dans la plateforme (liste, filtres par thème, message si vide) : devs, v0.5
- [ ] Alertes par organisation (`app.regulatory_alert`) selon le code NAF de l'organisation
- [ ] Option IA (résumé des textes) : à décider après analyse IA Act
- [ ] Légifrance PISTE pour les textes consolidés (codes du travail et de l'environnement) : après MVP
