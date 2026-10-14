import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Share } from '../core/metrics/common';
import { formatNumber, formatPercent } from './format';

export function Card({ title, subtitle, children, className = '' }: {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'danger';
}) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${tone === 'danger' ? 'danger' : ''}`}>{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

export const KpiRow = ({ children }: { children: ReactNode }) => <div className="kpi-row">{children}</div>;

export const Grid = ({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) => (
  <div className={`grid grid-${cols}`}>{children}</div>
);

/** Tableau de données équivalent au graphique (accessibilité : lecture sans le visuel). */
export function DataDetails({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="data-details">
      <summary>Voir les données</summary>
      <table className="table compact">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{typeof c === 'number' ? formatNumber(c) : c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Histogramme vertical + tableau « Voir les données ». */
export function BarSeries({ data, color = 'var(--chart)', valueLabel = 'Valeur', height = 200 }: {
  data: { label: string; value: number }[];
  color?: string;
  valueLabel?: string;
  height?: number;
}) {
  return (
    <>
      <div style={{ width: '100%', height }} role="img" aria-label={`Graphique : ${valueLabel}`}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number) => [formatNumber(v), valueLabel]} cursor={{ fill: 'var(--hover)' }} />
            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataDetails headers={['', valueLabel]} rows={data.map((d) => [d.label, d.value])} />
    </>
  );
}

/** Liste de répartition avec barres horizontales (versions, navigateurs, appareils…). */
export function ShareList({ items, empty = 'Aucune donnée pour l’instant.' }: { items: Share[]; empty?: string }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  return (
    <ul className="share-list">
      {items.map((i) => (
        <li key={i.label}>
          <div className="share-head">
            <span>{i.label}</span>
            <span className="mono">{formatNumber(i.count)} ({formatPercent(i.share)})</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${i.share * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export const Empty = ({ children = 'Aucune donnée pour l’instant.' }: { children?: ReactNode }) => (
  <p className="empty">{children}</p>
);
