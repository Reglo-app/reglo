import type {
  AppError, BusinessEvent, Company, Dataset, Device, Feedback, FeedbackCategory, FeedbackStatus,
  PageView, Release, Session, StoredDocument, User,
} from '../../core/contract';
import { DAY, MINUTE } from '../../core/metrics/common';

/** Générateur pseudo-aléatoire déterministe (mulberry32) : même graine = mêmes données. */
function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)];
  const weighted = <T,>(entries: readonly (readonly [T, number])[]) => {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = next() * total;
    for (const [v, w] of entries) if ((r -= w) <= 0) return v;
    return entries[entries.length - 1][0];
  };
  const gauss = () => Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
  const hex = (n: number) => Array.from({ length: n }, () => int(0, 15).toString(16)).join('');
  return { next, int, pick, weighted, gauss, hex, chance: (p: number) => next() < p };
}

const FIRST_NAMES = ['Camille', 'Julien', 'Sophie', 'Thomas', 'Léa', 'Nicolas', 'Claire', 'Antoine', 'Manon', 'Hugo', 'Sarah', 'Maxime', 'Laura', 'Romain', 'Emma', 'Pierre', 'Chloé', 'Lucas', 'Pauline', 'Mathieu'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Lambert', 'Fontaine', 'Rousseau', 'Mercier'];
const COMPANY_PREFIXES = ['Atelier', 'Groupe', 'Transports', 'Industries', 'BTP', 'Logistique', 'Agro', 'Chimie', 'Services', 'Métallerie'];
const COMPANY_NAMES = ['du Val', 'Armor', 'Loire', 'Océane', 'Horizon', 'Vertex', 'Delta', 'Mistral', 'Atlas', 'Boréal'];
const NAF_CODES = ['4120A', '4941A', '2511Z', '1013A', '5210B', '2059Z', '4321A', '3312Z', '8121Z', '4673A'];
const CITIES = [
  { city: 'Angers', lat: 47.47, lng: -0.55 },
  { city: 'Nantes', lat: 47.22, lng: -1.55 },
  { city: 'Rennes', lat: 48.11, lng: -1.68 },
  { city: 'Le Mans', lat: 48.0, lng: 0.2 },
  { city: 'Tours', lat: 47.39, lng: 0.69 },
  { city: 'Paris', lat: 48.86, lng: 2.35 },
  { city: 'Lyon', lat: 45.76, lng: 4.84 },
  { city: 'Bordeaux', lat: 44.84, lng: -0.58 },
  { city: 'Lille', lat: 50.63, lng: 3.06 },
  { city: 'Brest', lat: 48.39, lng: -4.49 },
] as const;
const BROWSERS = [['Chrome', 62], ['Edge', 18], ['Firefox', 10], ['Safari', 10]] as const;
const DEVICES = [['desktop', 75], ['mobile', 20], ['tablet', 5]] as const satisfies readonly (readonly [Device, number])[];
const PAGES = [['home', 30], ['watch', 22], ['trainings', 18], ['indicators', 10], ['documents', 8], ['actions', 7], ['profile', 3], ['help', 2]] as const;
const ERROR_SAMPLES = [
  { message: 'Function addDoc() called with invalid data. Unsupported field value: undefined (found in field ville)', type: 'promesse', page: 'home' },
  { message: 'TypeError: Cannot read properties of undefined (reading "progress")', type: 'exception', page: 'trainings' },
  { message: 'Failed to fetch /api/regulatory-alerts', type: 'réseau', page: 'watch' },
  { message: 'Upload failed: file exceeds 10 MB', type: 'promesse', page: 'documents' },
  { message: 'ChunkLoadError: Loading chunk indicators failed', type: 'exception', page: 'indicators' },
];
const FEEDBACK_SAMPLES: [FeedbackCategory, string][] = [
  ['improvement', 'Filtrer la veille par code NAF'],
  ['feature', 'Export PDF des attestations de formation'],
  ['bug', "La progression de formation ne se met pas à jour"],
  ['feature', 'Rappel avant échéance réglementaire'],
  ['improvement', 'Tableau des AT plus lisible sur mobile'],
  ['bug', "Erreur à l'import d'un document"],
  ['other', 'Proposition de partenariat organisme de formation'],
  ['feature', 'Modèle de DUERP pré-rempli'],
];

type Engagement = 'never' | 'low' | 'mid' | 'high';
const DAILY_PROBABILITY: Record<Engagement, number> = { never: 0, low: 0.04, mid: 0.15, high: 0.45 };

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const iso = (t: number) => new Date(t).toISOString();

export interface MockOptions {
  seed?: number;
  users?: number;
  /** Instant de référence (par défaut : maintenant). */
  now?: Date;
}

/** Génère un jeu de données fictif, conforme au contrat, réaliste pour Reglo. */
export function generateDataset({ seed = 42, users: userCount = 60, now = new Date() }: MockOptions = {}): Dataset {
  const r = createRandom(seed);
  const nowT = now.getTime();

  // Versions publiées sur 90 jours.
  const releases: Release[] = [
    { version: r.hex(7), date: iso(nowT - 80 * DAY), title: 'Lancement de la bêta', features: ['Veille réglementaire', 'Catalogue de formations'], improvements: [], fixes: [] },
    { version: r.hex(7), date: iso(nowT - 40 * DAY), title: 'Indicateurs QHSE', features: ['Tableau des accidents du travail'], improvements: ['Recherche dans la veille'], fixes: ['Affichage mobile des formations'] },
    { version: r.hex(7), date: iso(nowT - 6 * DAY), title: 'Aide, retours et suivi de vos demandes', features: ['Formulaire de retours', "Centre d'aide"], improvements: ['Temps de chargement'], fixes: ["Import de documents"] },
  ];
  const versionAt = (t: number) => {
    const current = [...releases].reverse().find((rel) => Date.parse(rel.date) <= t);
    return current?.version ?? releases[0].version;
  };

  const companies: Company[] = Array.from({ length: 15 }, (_, i) => ({
    id: `c${i + 1}`,
    name: `${r.pick(COMPANY_PREFIXES)} ${r.pick(COMPANY_NAMES)}`,
    naf: r.pick(NAF_CODES),
    plan: r.weighted([['essai', 5], ['essentiel', 3], ['pro', 2]] as const),
  }));
  const companyCity = new Map(companies.map((c) => [c.id, r.pick(CITIES)]));

  const users: User[] = [];
  const engagement = new Map<string, Engagement>();
  for (let i = 0; i < userCount; i++) {
    const first = r.pick(FIRST_NAMES);
    const last = r.pick(LAST_NAMES);
    const id = `u${i + 1}`;
    const admin = i === 0;
    users.push({
      id,
      name: admin ? 'Admin Reglo' : `${first} ${last}`,
      email: admin ? 'admin@reglo.test' : `${stripAccents(first)}.${stripAccents(last)}${i}@exemple.test`.toLowerCase(),
      role: admin ? 'admin' : 'user',
      suspended: !admin && r.chance(0.03),
      createdAt: iso(nowT - r.int(admin ? 150 : 1, 150) * DAY - r.int(0, 23) * 60 * MINUTE),
      companyId: admin ? undefined : r.pick(companies).id,
    });
    engagement.set(id, admin ? 'high' : r.weighted([['never', 15], ['low', 35], ['mid', 30], ['high', 20]] as const));
  }

  const sessions: Session[] = [];
  const pageViews: PageView[] = [];
  const errors: AppError[] = [];
  let errorId = 0;

  for (const user of users) {
    const p = DAILY_PROBABILITY[engagement.get(user.id)!];
    const start = Date.parse(user.createdAt);
    const consents = r.chance(0.7);
    const city = user.companyId ? companyCity.get(user.companyId)! : CITIES[0];

    for (let day = start; day <= nowT; day += DAY) {
      const d = new Date(day);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      if (!r.chance(weekend ? p * 0.2 : p)) continue;

      const hour = r.weighted([[8, 2], [9, 4], [10, 4], [11, 3], [14, 3], [15, 3], [16, 2], [17, 1], [20, 1]] as const);
      d.setHours(hour, r.int(0, 59), r.int(0, 59), 0);
      const t = d.getTime();
      if (t > nowT) continue;

      const session: Session = {
        id: `s${sessions.length + 1}`,
        userId: user.id,
        startedAt: iso(t),
        version: user.role === 'admin' && r.chance(0.5) ? 'local' : versionAt(t),
        browser: r.weighted(BROWSERS),
        device: r.weighted(DEVICES),
        loadTimeMs: Math.round(340 * Math.exp(r.gauss() * 0.35)),
        location: consents
          ? { lat: city.lat + r.gauss() * 0.02, lng: city.lng + r.gauss() * 0.02, city: city.city }
          : null,
      };
      sessions.push(session);

      const views = r.int(1, 6);
      for (let v = 0; v < views; v++) {
        const at = Math.min(t + v * r.int(1, 4) * MINUTE, nowT);
        pageViews.push({ sessionId: session.id, userId: user.id, page: r.weighted(PAGES), at: iso(at) });
      }

      if (r.chance(0.04)) {
        const sample = r.pick(ERROR_SAMPLES);
        errors.push({
          id: `e${++errorId}`, ...sample, version: session.version, browser: session.browser,
          userId: user.id, sessionId: session.id, at: iso(Math.min(t + r.int(0, 10) * MINUTE, nowT)),
        });
      }
    }
  }

  // Pic d'erreurs récent (déclenche le point d'attention).
  const recent = [...sessions].reverse().find((s) => Date.parse(s.startedAt) > nowT - DAY);
  for (let i = 0; i < 6; i++) {
    errors.push({
      id: `e${++errorId}`, ...ERROR_SAMPLES[0], version: recent?.version ?? releases[2].version,
      browser: recent?.browser ?? 'Chrome', userId: recent?.userId, sessionId: recent?.id,
      at: iso(nowT - r.int(10, 20 * 60) * MINUTE),
    });
  }

  // Événements métier (étapes d'entonnoir, objets suivis).
  const businessEvents: BusinessEvent[] = [];
  const at = (from: number, maxDays: number) => iso(Math.min(from + r.next() * maxDays * DAY, nowT));
  for (const user of users) {
    const level = engagement.get(user.id)!;
    if (level === 'never') continue;
    const created = Date.parse(user.createdAt);
    if (!r.chance(0.85)) continue;
    businessEvents.push({ userId: user.id, type: 'company_profile_completed', at: at(created, 2) });
    if (!r.chance(level === 'low' ? 0.4 : 0.8)) continue;
    const trainings = r.int(1, level === 'high' ? 6 : 2);
    for (let i = 0; i < trainings; i++) {
      businessEvents.push({ userId: user.id, type: 'training_started', at: at(created + DAY, 20) });
      if (r.chance(0.6)) businessEvents.push({ userId: user.id, type: 'training_completed', at: at(created + 5 * DAY, 30) });
    }
    const alerts = level === 'high' ? r.int(5, 25) : r.int(0, 6);
    for (let i = 0; i < alerts; i++) businessEvents.push({ userId: user.id, type: 'regulatory_alert_viewed', at: at(created, 120) });
    if (r.chance(level === 'high' ? 0.6 : 0.2)) businessEvents.push({ userId: user.id, type: 'subscription_started', at: at(created + 7 * DAY, 30) });
  }

  // Documents.
  const documents: StoredDocument[] = [];
  for (const user of users) {
    if (engagement.get(user.id) === 'never' || !r.chance(0.55)) continue;
    const count = r.int(1, engagement.get(user.id) === 'high' ? 14 : 4);
    for (let i = 0; i < count; i++) {
      const created = Date.parse(user.createdAt) + r.next() * (nowT - Date.parse(user.createdAt));
      documents.push({
        id: `d${documents.length + 1}`,
        userId: user.id,
        sizeBytes: r.int(40_000, 3_000_000),
        type: r.pick(['DUERP', 'Procédure', 'Attestation', "Rapport d'audit", 'Fiche de sécurité']),
        createdAt: iso(created),
        deletedAt: r.chance(0.1) ? iso(Math.min(created + r.int(1, 20) * DAY, nowT)) : undefined,
      });
    }
  }

  // Retours.
  const feedback: Feedback[] = FEEDBACK_SAMPLES.map(([category, title], i) => {
    const createdAt = nowT - r.int(1, 45) * DAY;
    const status: FeedbackStatus = r.weighted([['open', 4], ['in_progress', 2], ['done', 3]] as const);
    return {
      id: `f${i + 1}`,
      userId: r.pick(users.slice(1)).id,
      category,
      title,
      status,
      createdAt: iso(createdAt),
      answeredAt: status === 'open' ? undefined : iso(Math.min(createdAt + r.int(1, 5) * DAY, nowT)),
    };
  });

  return {
    generatedAt: now.toISOString(),
    users, companies, sessions, pageViews, errors, feedback, documents, releases, businessEvents,
  };
}
