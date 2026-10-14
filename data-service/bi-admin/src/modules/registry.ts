import type { ModuleId } from '../core/config';
import { Adoption } from './Adoption';
import { Connections } from './Connections';
import { Content } from './Content';
import { Feedback } from './Feedback';
import { Health } from './Health';
import { Overview } from './Overview';
import { Releases } from './Releases';
import type { BiModule } from './types';
import { Users } from './Users';

/** Catalogue des modules. Les modules affichés et leur ordre viennent de la configuration. */
export const MODULES: Record<ModuleId, BiModule> = {
  overview: { id: 'overview', label: 'Vue d’ensemble', Component: Overview },
  health: { id: 'health', label: 'Santé du système', Component: Health },
  adoption: { id: 'adoption', label: 'Adoption', Component: Adoption },
  content: { id: 'content', label: 'Contenu', Component: Content },
  feedback: { id: 'feedback', label: 'Retours', Component: Feedback },
  connections: { id: 'connections', label: 'Connexions', Component: Connections },
  users: { id: 'users', label: 'Utilisateurs', Component: Users },
  releases: { id: 'releases', label: 'Nouveautés', Component: Releases },
};
