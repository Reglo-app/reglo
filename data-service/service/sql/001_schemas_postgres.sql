-- Réglo · modèle de données partagé (PROPOSITION à valider avec les devs)
-- Référence : docs/data/05-modele-de-donnees.md
--
-- Propriété des schémas :
--   app       → API Symfony (migrations Doctrine). Ce fichier sert de RÉFÉRENCE aux devs ; ce sont
--               leurs migrations Doctrine qui font foi. Le service data n'y a qu'un accès en lecture.
--   veille    → service data (textes réglementaires, journal des collectes).
--   analytics → service data (événements produit, vues d'indicateurs).
-- Isolation multi-tenant : organization_id sur chaque table métier.

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS veille;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ───────────────────────────── app (référence pour Doctrine) ─────────────────────────────
CREATE TABLE app.organization (
    id          uuid PRIMARY KEY,
    name        varchar(255) NOT NULL,
    naf_code    varchar(6),                 -- ex. 4120A : ciblage de la veille par secteur
    size_band   varchar(20),                -- tranche d'effectif
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.app_user (
    id            uuid PRIMARY KEY,
    email         varchar(255) NOT NULL UNIQUE,
    full_name     varchar(255),
    password_hash varchar(255) NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.membership (
    organization_id uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    role            varchar(20) NOT NULL CHECK (role IN ('owner', 'manager', 'member')),
    PRIMARY KEY (organization_id, user_id)
);

-- Questionnaire versionné : un diagnostic reste comparable même si les questions évoluent (US-10).
CREATE TABLE app.questionnaire_version (
    version       varchar(50) PRIMARY KEY,  -- ex. « 2027-1 »
    published_at  timestamptz,
    definition    jsonb NOT NULL            -- piliers, thématiques, questions, poids (format reglo_data)
);

CREATE TABLE app.diagnostic (
    id                    uuid PRIMARY KEY,
    organization_id       uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    questionnaire_version varchar(50) NOT NULL REFERENCES app.questionnaire_version(version),
    status                varchar(20) NOT NULL CHECK (status IN ('draft', 'validated', 'archived')),
    started_at            timestamptz NOT NULL DEFAULT now(),
    validated_at          timestamptz,
    CHECK (status <> 'validated' OR validated_at IS NOT NULL)
);
CREATE INDEX diagnostic_org_idx ON app.diagnostic (organization_id, validated_at DESC);

CREATE TABLE app.answer (
    diagnostic_id   uuid NOT NULL REFERENCES app.diagnostic(id) ON DELETE CASCADE,
    question_id     varchar(20) NOT NULL,   -- identifiant dans questionnaire_version.definition
    value           jsonb,                  -- yes/no/partial, niveau, option(s)
    not_applicable  boolean NOT NULL DEFAULT false,
    justification   text,
    answered_by     uuid REFERENCES app.app_user(id),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (diagnostic_id, question_id)
);

-- Scores produits par le service data (POST /scores), enregistrés par l'API.
CREATE TABLE app.score (
    diagnostic_id uuid NOT NULL REFERENCES app.diagnostic(id) ON DELETE CASCADE,
    scope         varchar(10) NOT NULL CHECK (scope IN ('global', 'pillar', 'theme')),
    key           varchar(50) NOT NULL,     -- « global », id du pilier ou de la thématique
    value         numeric(5, 1) CHECK (value BETWEEN 0 AND 100),
    algo_version  varchar(20) NOT NULL,
    computed_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (diagnostic_id, scope, key)
);

CREATE TABLE app.action (
    id                 uuid PRIMARY KEY,
    organization_id    uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    title              varchar(255) NOT NULL,
    description        text,
    pillar             varchar(50),
    source_question_id varchar(20),         -- action issue d'un écart du diagnostic
    owner_id           uuid REFERENCES app.app_user(id),
    due_date           date,
    status             varchar(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX action_org_status_idx ON app.action (organization_id, status, due_date);

CREATE TABLE app.document (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    file_name       varchar(255) NOT NULL,
    storage_path    varchar(500) NOT NULL,  -- disque du VPS (dossier technique)
    sha256          char(64) NOT NULL,
    mime            varchar(100) NOT NULL,
    size_bytes      integer NOT NULL CHECK (size_bytes <= 20971520),  -- 20 Mo (US-07)
    action_id       uuid REFERENCES app.action(id) ON DELETE SET NULL,
    diagnostic_id   uuid,
    question_id     varchar(20),
    uploaded_by     uuid NOT NULL REFERENCES app.app_user(id),
    uploaded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.training_module (
    id     uuid PRIMARY KEY,
    title  varchar(255) NOT NULL,
    theme  varchar(50),
    free   boolean NOT NULL DEFAULT false   -- offre « Découverte » (US-08)
);

CREATE TABLE app.enrollment (
    user_id         uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    module_id       uuid NOT NULL REFERENCES app.training_module(id),
    organization_id uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    progress        numeric(4, 3) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
    quiz_score      numeric(5, 1) CHECK (quiz_score BETWEEN 0 AND 100),
    completed_at    timestamptz,
    PRIMARY KEY (user_id, module_id)
);

CREATE TABLE app.certificate (
    id                uuid PRIMARY KEY,
    organization_id   uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    user_id           uuid NOT NULL REFERENCES app.app_user(id),
    module_id         uuid REFERENCES app.training_module(id),
    verification_code varchar(32) NOT NULL UNIQUE,  -- vérifiable par un tiers (fonctionnalité 3)
    issued_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.regulatory_alert (
    organization_id uuid NOT NULL REFERENCES app.organization(id) ON DELETE CASCADE,
    text_id         varchar(64) NOT NULL,   -- veille.regulatory_text.id
    read_at         timestamptz,
    PRIMARY KEY (organization_id, text_id)
);

-- ───────────────────────────── veille (service data) ─────────────────────────────
CREATE TABLE veille.regulatory_text (
    id            varchar(64) PRIMARY KEY,  -- JORFTEXT…, celex-…
    source        varchar(20) NOT NULL,     -- JORF | EUR-Lex
    nature        varchar(40),
    reference     varchar(80),              -- NOR, numéro CELEX
    title         text NOT NULL,
    authority     varchar(255),
    published_at  date NOT NULL,
    url           varchar(500) NOT NULL,
    themes        jsonb NOT NULL,           -- ["social", "dechets"…]
    naf_scope     jsonb NOT NULL,           -- [] = tous secteurs
    collected_at  timestamptz NOT NULL
);
CREATE INDEX regulatory_text_date_idx ON veille.regulatory_text (published_at DESC);
CREATE INDEX regulatory_text_themes_idx ON veille.regulatory_text USING gin (themes);  -- filtre US-11

CREATE TABLE veille.collection_run (
    id                 serial PRIMARY KEY,
    source             varchar(20) NOT NULL,
    started_at         timestamptz NOT NULL,
    finished_at        timestamptz,
    ok                 boolean,
    read               integer,
    kept               integer,
    excluded_personal  integer,
    error              text
);

-- ───────────────────────────── analytics (service data) ─────────────────────────────
-- Contrat d'événements : docs/data/07-contrat-evenements-et-indicateurs.md
CREATE TABLE analytics.event (
    id              bigserial PRIMARY KEY,
    name            varchar(60) NOT NULL,
    occurred_at     timestamptz NOT NULL,
    organization_id uuid,
    user_id         uuid,
    session_id      uuid,
    properties      jsonb
);
CREATE INDEX event_name_time_idx ON analytics.event (name, occurred_at);
CREATE INDEX event_org_time_idx ON analytics.event (organization_id, occurred_at);

-- ───────────────────────────── droits ─────────────────────────────
-- Rôle technique du service data : lecture sur app, écriture sur veille et analytics.
-- CREATE ROLE reglo_data LOGIN PASSWORD '…';   -- mot de passe géré hors dépôt (secrets du VPS)
-- GRANT USAGE ON SCHEMA app TO reglo_data;
-- GRANT SELECT ON ALL TABLES IN SCHEMA app TO reglo_data;
-- GRANT USAGE, CREATE ON SCHEMA veille, analytics TO reglo_data;
