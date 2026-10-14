import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { connectionsMetrics, WEEKDAYS } from '../core/metrics/connections';
import { Card, DataDetails, Kpi, KpiRow } from '../ui/components';
import { formatNumber, formatPercent, plural } from '../ui/format';
import type { ModuleProps } from './types';

const PERIODS = [7, 30, 90];
const SHORT_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function Connections({ data, now }: ModuleProps) {
  const [days, setDays] = useState(30);
  const m = connectionsMetrics(data, now, days);
  const maxCluster = Math.max(1, ...m.clusters.map((c) => c.count));

  return (
    <>
      <div className="segmented" role="group" aria-label="Période">
        {PERIODS.map((p) => (
          <button key={p} className={p === days ? 'active' : ''} aria-pressed={p === days} onClick={() => setDays(p)}>
            {p} jours
          </button>
        ))}
      </div>

      <KpiRow>
        <Kpi label="Sessions" value={formatNumber(m.sessions)} hint={plural(m.distinctUsers, 'compte distinct', 'comptes distincts')} />
        <Kpi label="Sessions localisées" value={formatPercent(m.localizedShare)} hint="avec consentement « localisation »" />
        <Kpi label="Heure de pointe" value={m.peakHour === null ? '—' : `${m.peakHour} h`} />
        <Kpi label="Jour le plus actif" value={m.busiestWeekday ?? '—'} />
      </KpiRow>

      <Card
        title="Carte des connexions"
        subtitle="Position approximative (environ 10 km) déduite de l’adresse IP, uniquement pour les sessions ayant accepté la localisation. Cercles proportionnels au nombre de sessions."
      >
        <div className="map">
          <MapContainer center={[46.8, 2.0]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {m.clusters.map((c) => (
              <CircleMarker
                key={`${c.lat},${c.lng}`}
                center={[c.lat, c.lng]}
                radius={6 + 18 * Math.sqrt(c.count / maxCluster)}
                pathOptions={{ color: '#b4471f', fillColor: '#c75b2f', fillOpacity: 0.6, weight: 1 }}
              >
                <Tooltip>{plural(c.count, 'session')}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <DataDetails headers={['Latitude', 'Longitude', 'Sessions']} rows={m.clusters.map((c) => [c.lat, c.lng, c.count])} />
      </Card>

      <Card title="Connexions par jour et par heure">
        <div className="heatmap" role="img" aria-label="Carte de chaleur des connexions par jour et par heure">
          <div />
          {Array.from({ length: 24 }, (_, h) => <div key={h} className="heat-hour">{h % 3 === 0 ? h : ''}</div>)}
          {m.heatmap.map((row, d) => (
            <div key={d} className="heat-row">
              <div className="heat-day">{SHORT_DAYS[d]}</div>
              {row.map((v, h) => (
                <div
                  key={h}
                  className="heat-cell"
                  title={`${WEEKDAYS[d]} ${h} h : ${v} session(s)`}
                  style={{ opacity: v ? 0.25 + 0.75 * (v / (m.heatmapMax || 1)) : 1, background: v ? 'var(--chart)' : 'var(--empty-cell)' }}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="footnote">Moins → Plus (max {m.heatmapMax})</p>
        <DataDetails
          headers={['Jour', ...Array.from({ length: 24 }, (_, h) => `${h} h`)]}
          rows={m.heatmap.map((row, d) => [SHORT_DAYS[d], ...row])}
        />
      </Card>
    </>
  );
}
