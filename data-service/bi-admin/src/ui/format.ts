const nf = new Intl.NumberFormat('fr-FR');

export const formatNumber = (n: number) => nf.format(n);

export const formatPercent = (share: number) => `${nf.format(Math.round(share * 100))} %`;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go', 'To'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${nf.format(Math.round(v * 10) / 10)} ${units[i]}`;
}

export const formatMs = (ms: number | null) => (ms === null ? '—' : `${nf.format(Math.round(ms))} ms`);

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const dateYearFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const formatDate = (d: string | number | null) => (d === null ? '—' : dateFmt.format(new Date(d)));
export const formatDateYear = (d: string | number | null) => (d === null ? '—' : dateYearFmt.format(new Date(d)));
export const formatDateTime = (d: string | number | null) => (d === null ? '—' : dateTimeFmt.format(new Date(d)));

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${formatNumber(n)} ${n > 1 ? pluralWord : word}`;
