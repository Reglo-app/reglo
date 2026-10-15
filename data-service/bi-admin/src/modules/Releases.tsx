import { useState, type FormEvent } from 'react';
import type { Release } from '../core/contract';
import { Card, Empty, Grid } from '../ui/components';
import { formatDateYear, plural } from '../ui/format';
import type { ModuleProps } from './types';

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export function Releases({ data, now, actions, reload }: ModuleProps) {
  const latestVersion = [...data.releases].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0]?.version ?? '';
  const empty = { version: '', date: now.toISOString().slice(0, 10), title: '', features: '', improvements: '', fixes: '' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const release: Release = {
      version: form.version.trim(),
      date: new Date(form.date).toISOString(),
      title: form.title.trim(),
      features: lines(form.features),
      improvements: lines(form.improvements),
      fixes: lines(form.fixes),
    };
    if (editing && editing !== release.version) await actions.deleteRelease(editing);
    await actions.publishRelease(release);
    setForm(empty);
    setEditing(null);
    await reload();
  };

  const edit = (r: Release) => {
    setEditing(r.version);
    setForm({
      version: r.version, date: r.date.slice(0, 10), title: r.title,
      features: r.features.join('\n'), improvements: r.improvements.join('\n'), fixes: r.fixes.join('\n'),
    });
  };

  const remove = async (version: string) => {
    if (!window.confirm(`Supprimer la version ${version} ?`)) return;
    await actions.deleteRelease(version);
    await reload();
  };

  const releases = [...data.releases].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return (
    <Grid>
      <Card title={editing ? `Modifier la version ${editing}` : 'Publier une version'}>
        <form className="form" onSubmit={submit}>
          <div className="form-row">
            <label>Version<input required value={form.version} placeholder={latestVersion} onChange={set('version')} /></label>
            <label>Date<input required type="date" value={form.date} onChange={set('date')} /></label>
          </div>
          <label>Titre<input required value={form.title} placeholder="Ex. Rappels avant échéance réglementaire" onChange={set('title')} /></label>
          <label>Nouvelles fonctionnalités<textarea rows={3} value={form.features} onChange={set('features')} /></label>
          <label>Améliorations<textarea rows={3} value={form.improvements} onChange={set('improvements')} /></label>
          <label>Corrections<textarea rows={3} value={form.fixes} onChange={set('fixes')} /></label>
          <p className="footnote">Une ligne par élément. Les sections vides ne sont pas affichées.</p>
          <div className="form-row">
            <button className="button primary" type="submit">{editing ? 'Enregistrer' : 'Publier'}</button>
            {editing && <button className="button" type="button" onClick={() => { setEditing(null); setForm(empty); }}>Annuler</button>}
          </div>
        </form>
      </Card>

      <Card title="Versions publiées">
        {releases.length ? (
          <ul className="release-list">
            {releases.map((r) => (
              <li key={r.version} className="card release">
                <div className="error-head">
                  <span className="mono muted small">{formatDateYear(r.date)} · {r.version}</span>
                  <span>
                    <button className="link" aria-label={`Modifier ${r.version}`} onClick={() => edit(r)}>✎</button>{' '}
                    <button className="link danger" aria-label={`Supprimer ${r.version}`} onClick={() => remove(r.version)}>🗑</button>
                  </span>
                </div>
                <strong>{r.title}</strong>
                <div className="small muted">
                  {plural(r.features.length, 'nouveauté')} · {plural(r.improvements.length, 'amélioration')} · {plural(r.fixes.length, 'correction')}
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>Aucune version publiée.</Empty>}
      </Card>
    </Grid>
  );
}
