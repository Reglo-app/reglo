import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { regloConfig } from './config/reglo.config';
import type { DataSource } from './core/datasource';
import { createHttpDataSource } from './datasources/http/httpDataSource';
import { createMockDataSource } from './datasources/mock/mockDataSource';
import './styles.css';

/**
 * Choix de la source de données (fichier .env.local) :
 *   VITE_BI_SOURCE=mock (défaut)  → données fictives
 *   VITE_BI_SOURCE=http + VITE_BI_API_URL=/api/admin/bi → API Reglo
 */
const source: DataSource =
  import.meta.env.VITE_BI_SOURCE === 'http'
    ? createHttpDataSource(import.meta.env.VITE_BI_API_URL ?? '/api/admin/bi')
    : createMockDataSource({ seed: 42, users: 60 });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App source={source} config={regloConfig} />
  </StrictMode>,
);
