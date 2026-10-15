# Réglo — Registre des activités de traitement (brouillon v0)

> **Statut : brouillon de travail, à compléter et valider** (carte Trello « Registre des traitements,
> conformité RGPD et politique de confidentialité v1 », PHASE B, échéance proposée 20 nov.).
> Structure inspirée du modèle de registre de la CNIL (art. 30 RGPD). Les durées et bases légales
> sont des **propositions à vérifier** ; l'analyse de conformité finale est à rédiger par Alexis.

---

## 0. Rôles de Réglo

| Situation | Rôle de Réglo | Conséquence |
|---|---|---|
| Prospects, clients (responsables RSE), site, newsletter, pilotage interne | **Responsable de traitement** | Registre ci-dessous (partie A) |
| Données des **salariés des entreprises clientes** saisies dans la plateforme (comptes collaborateurs, progression des formations, actions assignées, documents) | **Sous-traitant** (l'employeur client est responsable) **[À VALIDER]** | Contrat de sous-traitance (art. 28) annexé aux CGV ; registre « sous-traitant » (partie B) |

---

## A. Traitements dont Réglo est responsable

| # | Traitement | Finalité | Base légale (proposée) | Personnes | Données | Destinataires | Durée de conservation (proposée) |
|---|---|---|---|---|---|---|---|
| A1 | Gestion des clients et des comptes administrateurs | Activer les organisations (US-01), gérer l'accès et la relation client | Contrat (6.1.b) | Responsables / administrateurs clients | Identité, e-mail pro, rôle, organisation, historique de connexion | Équipe Réglo habilitée | Durée du contrat + 3 ans (prospection) |
| A2 | Prospection et site vitrine | Formulaires de contact, demandes d'accompagnement, newsletter | Consentement (newsletter) / intérêt légitime (B2B) | Prospects | Identité, e-mail pro, entreprise, message | Équipe commerciale | 3 ans après le dernier contact |
| A3 | Mesure d'audience du site | Statistiques de fréquentation | Consentement (sauf outil exempté CNIL) | Visiteurs | Identifiants techniques, pages vues | Outil d'analytics (à choisir) | 13 mois (traceurs), 25 mois (statistiques) |
| A4 | Pilotage de la plateforme (BI admin) | Santé applicative, adoption, retours, amélioration | Intérêt légitime (6.1.f) | Utilisateurs de la plateforme | Sessions, pages vues, erreurs, retours ; géolocalisation approximative **avec consentement** | Équipe Réglo (admins) | 13 mois pour les événements bruts, agrégats au-delà |
| A5 | Sécurité et journalisation | Traçabilité des accès, détection d'incidents | Intérêt légitime / obligation de sécurité (art. 32) | Utilisateurs | Journaux de connexion (IP, horodatage, résultat) | Équipe technique / cyber | 6 mois à 1 an (recommandation CNIL) |
| A6 | Facturation et abonnements | Gestion des souscriptions (hors MVP : prestataire de paiement) | Obligation légale / contrat | Clients | Identité de facturation, montants | Comptable, prestataire de paiement | 10 ans (pièces comptables) |
| A7 | Veille réglementaire et veille marché | Informer les clients, étude de marché | Intérêt légitime | **Aucune donnée personnelle visée** (textes officiels, open data, annonces légales d'entreprises) | — | — | Sans objet (données publiques) |

## B. Traitements réalisés pour le compte des clients (sous-traitance) **[À VALIDER]**

| # | Traitement | Pour le compte de | Données | Mesures spécifiques |
|---|---|---|---|---|
| B1 | Comptes collaborateurs et droits | L'entreprise cliente | Identité, e-mail pro, rôle | Isolation par organisation, mots de passe hachés, blocage après 5 échecs (US-02) |
| B2 | Diagnostic RSE / QHSE et scores | L'entreprise cliente | Réponses de l'organisation, justifications, auteur des réponses | Scores calculés par organisation, pas de croisement entre clients |
| B3 | Plan d'actions | L'entreprise cliente | Actions, responsable assigné, échéances, statut | Assignation limitée aux membres de l'organisation (US-05) |
| B4 | Espace documentaire (preuves) | L'entreprise cliente | Documents déposés, auteur, date (US-07) | Formats et taille limités, accès réservé à l'organisation, stockage en France |
| B5 | Formations, quiz et certificats | L'entreprise cliente | Progression, résultats aux quiz, certificats | **Évaluation de salariés** : voir AIPD ci-dessous ; visibilité limitée au responsable |

---

## C. Mesures de sécurité communes (à confirmer avec Florian et les devs)

- Hébergement en France (VPS école), conteneurs isolés, HTTPS, pare-feu, accès SSH par clé.
- Sauvegardes quotidiennes chiffrées de la base et des documents.
- Isolation multi-tenant : `organization_id` sur chaque table, tests automatiques sur chaque route.
- Authentification : mots de passe hachés, verrouillage progressif, messages d'erreur génériques.
- Principe du moindre privilège : rôles responsable / collaborateur / administrateur Réglo.
- Journalisation des accès administrateur et des exports (ex. export CSV du BI admin).

## D. Transferts hors Union européenne

Aucun prévu dans le MVP. **À vérifier** pour chaque outil tiers : analytics, e-mail transactionnel,
prestataire de paiement, polices web chargées depuis Google (alternative : auto-hébergement), et toute
API d'IA éventuelle.

## E. Analyse d'impact (AIPD) : pré-analyse

La CNIL recommande une AIPD quand au moins deux critères de sa liste sont réunis. Critères
potentiellement concernés :

| Critère CNIL | Concerné ? |
|---|---|
| Évaluation / notation de personnes | **Oui** : résultats de quiz et certificats des salariés (B5) |
| Personnes vulnérables (dont salariés vis-à-vis de l'employeur) | **Oui** : suivi de formation visible par l'employeur |
| Données sensibles (dont santé) | **Non dans le MVP** si aucune donnée nominative d'accident ou de maladie n'est stockée |
| Croisement de données, surveillance systématique, données à grande échelle | À apprécier |

→ **Pré-conclusion à valider** : une AIPD paraît recommandée pour le suivi des formations (B5) ; à
mener par le client (responsable) avec l'appui de Réglo (sous-traitant).

## F. IA Act

Aucun système d'IA dans le MVP proposé. Si une IA est ajoutée (classement ou résumé des textes de
veille), elle relèverait a priori du risque minimal, avec obligation de transparence si l'utilisateur
interagit avec elle. **À ne pas utiliser** pour noter ou évaluer des salariés (risque élevé possible
dans le domaine de l'emploi).

---

## Points à trancher

- [ ] Confirmer le rôle de sous-traitant pour les données des salariés clients (partie B)
- [ ] Choisir l'outil d'analytics du site (exempté de consentement ou non)
- [ ] Valider les durées de conservation avec l'équipe business (contrat, prospection)
- [ ] Décider si des données d'accidents du travail nominatives seront stockées (si oui : données de santé, AIPD obligatoire)
- [ ] Rédiger la politique de confidentialité v1 à partir de ce registre
