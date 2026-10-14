import type { FC } from 'react';
import type { BiConfig, ModuleId } from '../core/config';
import type { Dataset } from '../core/contract';
import type { DataSourceActions } from '../core/datasource';

export interface ModuleProps {
  data: Dataset;
  config: BiConfig;
  now: Date;
  actions: DataSourceActions;
  /** Navigue vers un autre onglet. */
  goTo: (id: ModuleId) => void;
  /** Recharge les données après une action. */
  reload: () => Promise<void>;
}

export interface BiModule {
  id: ModuleId;
  label: string;
  Component: FC<ModuleProps>;
}
