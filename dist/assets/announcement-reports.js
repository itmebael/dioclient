export function reportPhotos(row) {
  const photos = Array.isArray(row.photo_urls) ? row.photo_urls : [];
  return photos.filter(url => typeof url === 'string' && /^https?:\/\//i.test(url));
}

export function isFinancialReport(row) {
  return String(row.category || '').toLowerCase() === 'financial report';
}

export function AnnouncementPhotos({ React, row }) {
  const h = React.createElement;
  const [selected, setSelected] = React.useState(null);
  const dialog = React.useRef(null);
  const photos = reportPhotos(row);
  React.useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
  }, [selected]);
  if (!photos.length) return null;
  return h('div', { className: 'announcement-photos' },
    h('p', null, 'Photos uploaded by the parish'),
    h('div', { className: 'announcement-photos__grid' }, photos.map((url, index) =>
      h('button', { key: `${url}-${index}`, type: 'button', onClick: () => setSelected(index), 'aria-label': `View photo ${index + 1} for ${row.title}` },
        h('img', { src: url, alt: `${row.title} — photo ${index + 1}`, loading: 'lazy' })))),
    h('dialog', { ref: dialog, className: 'announcement-photo-viewer', onClose: () => setSelected(null), onClick: event => { if (event.target === event.currentTarget) dialog.current.close(); } },
      h('div', { className: 'announcement-photo-viewer__header' },
        h('strong', null, row.title),
        h('button', { type: 'button', onClick: () => dialog.current.close(), 'aria-label': 'Close photo viewer' }, 'Close')),
      selected !== null && h('img', { src: photos[selected], alt: `${row.title} — photo ${selected + 1}` }),
      photos.length > 1 && h('div', { className: 'announcement-photo-viewer__controls' },
        h('button', { type: 'button', onClick: () => setSelected((selected + photos.length - 1) % photos.length) }, 'Previous'),
        h('span', null, `${selected + 1} / ${photos.length}`),
        h('button', { type: 'button', onClick: () => setSelected((selected + 1) % photos.length) }, 'Next'))));
}

export function FinancialReports({ React, rows, loading, error, parishName, onRetry }) {
  const h = React.createElement;
  const reports = rows.filter(isFinancialReport);
  return h('article', { className: 'user-panel user-panel--wide financial-reports-panel' },
    h('div', { className: 'user-panel__header' }, h('h4', null, 'Financial Reports')),
    loading ? h('p', { role: 'status' }, 'Loading financial reports…') : error ?
      h('div', { role: 'alert' }, h('p', null, 'Financial reports could not be loaded.'), h('button', { type: 'button', onClick: onRetry }, 'Try again')) :
      reports.length ? h('div', { className: 'announcement-board' }, reports.map(row =>
        h('article', { className: 'announcement-card announcement-card--user', key: row.id },
          h('div', { className: 'announcement-card__body' },
            h('div', { className: 'announcement-card__topline' }, h('span', null, row.parish_name || 'Diocese-wide'), h('span', { className: 'status-badge status-badge--green' }, 'Published')),
            h('h5', null, row.title), h('p', null, row.content),
            h('small', null, new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })),
            h(AnnouncementPhotos, { React, row }))))) :
        h('p', null, parishName ? 'No financial reports published yet. Reports and photos uploaded by your parish will appear here.' : 'Link your account to a parish to view its financial reports.'));
}
