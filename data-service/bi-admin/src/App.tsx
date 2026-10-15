import { useCallback, useEffect, useState } from 'react';
import type { BiConfig, ModuleId } from './core/config';
import type { Dataset } from './core/contract';
import type { DataSource } from './core/datasource';
import { MODULES } from './modules/registry';
import { formatDateTime, plural } from './ui/format';

export function App({ source, config }: { source: DataSource; config: BiConfig }) {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ModuleId>(config.modules[0]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await source.load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const active = MODULES[tab];

  return (
    <main className="page">
      <header>
        <h1>Administration</h1>
        <p className="subtitle">Pilotage de {config.appName}, réservé aux administrateurs.</p>
        <nav className="tabs" aria-label="Onglets d’administration">
          {config.modules.map((id) => (
            <button key={id} className={id === tab ? 'tab active' : 'tab'} aria-current={id === tab ? 'page' : undefined} onClick={() => setTab(id)}>
              {MODULES[id].label}
            </button>
          ))}
        </nav>
        <div className="freshness">
          <span>
            {data
              ? `Données du ${formatDateTime(data.generatedAt)} · ${plural(data.users.length, 'compte')} · connexions sur ${config.windows.activityDays} jours, erreurs sur ${config.windows.errorsDays} jours`
              : 'Chargement…'}
          </span>
          <button className="button" onClick={() => void reload()} disabled={loading}>
            ↻ {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </header>

      {error && <p className="error-banner" role="alert">Impossible de charger les données : {error}</p>}

      {data && (
        <active.Component
          data={data}
          config={config}
          now={new Date(data.generatedAt)}
          actions={source.actions}
          goTo={setTab}
          reload={reload}
        />
      )}
    </main>
  );
}
