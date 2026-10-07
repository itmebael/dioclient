export function reportPhotos(row) {
  let photos = row.photo_urls || row.image_urls || row.image_url || [];
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = [photos]; }
  }
  if (!Array.isArray(photos)) photos = [photos];
  return photos.map(photo => typeof photo === 'string' ? photo : photo?.url || photo?.publicUrl || photo?.signedUrl)
    .filter(url => typeof url === 'string' && /^(https?:\/\/|\/storage\/v1\/)/i.test(url))
    .map(url => url.startsWith('/') ? `https://lnipoknkbjcxwnggzrnm.supabase.co${url}` : url);
}

export function authenticatedPhotoUrl(url) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://lnipoknkbjcxwnggzrnm.supabase.co') return null;
  if (!/^\/storage\/v1\/object\/(public|sign|authenticated)\//.test(parsed.pathname)) return null;
  parsed.pathname = parsed.pathname.replace(/\/object\/(public|sign)\//, '/object/authenticated/');
  parsed.search = '';
  return parsed.href;
}

function FeedPhoto({ React, url, alt, ...props }) {
  const [source, setSource] = React.useState(url);
  const [failed, setFailed] = React.useState(false);
  const [retry, setRetry] = React.useState(false);
  React.useEffect(() => { setSource(url); setFailed(false); setRetry(false); }, [url]);
  React.useEffect(() => {
    if (!retry) return;
    let active = true, objectUrl;
    (async () => {
      try {
        const endpoint = authenticatedPhotoUrl(url);
        let session;
        for (const storage of [window.sessionStorage, window.localStorage]) {
          const raw = storage.getItem('diocese-dashboard-db-session');
          if (raw) { session = JSON.parse(raw); break; }
        }
        const token = session?.accessToken || session?.access_token;
        if (!endpoint || !token) throw new Error('Photo unavailable');
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Photo unavailable');
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Photo unavailable');
        if (active) { objectUrl = URL.createObjectURL(blob); setSource(objectUrl); }
      } catch { if (active) setFailed(true); }
    })();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [retry, url]);
  return failed ? React.createElement('span', { role: 'status' }, 'Photo unavailable. The parish may need to restore the file or its viewing permission.') :
    React.createElement('img', { ...props, src: source, alt, onError: () => retry ? setFailed(true) : setRetry(true) });
}

export function isFinancialReport(row) {
  return String(row.category || '').toLowerCase() === 'financial report';
}

export function FeedPostHeader({ React, name, date, category = 'Parish announcement' }) {
  const h = React.createElement;
  const initials = (name || 'Parish Office').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('');
  return h('header', { className: 'feed-post-header' },
    h('span', { className: 'feed-avatar', 'aria-hidden': true }, initials),
    h('div', { className: 'feed-post-identity' },
      h('strong', null, name || 'Parish Office'),
      h('div', { className: 'feed-post-meta' },
        date && h('time', { dateTime: date }, new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
        h('span', null, category))));
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
        h(FeedPhoto, { React, url, alt: `${row.title} — photo ${index + 1}`, loading: 'lazy' })))),
    h('dialog', { ref: dialog, className: 'announcement-photo-viewer', onClose: () => setSelected(null), onClick: event => { if (event.target === event.currentTarget) dialog.current.close(); } },
      h('div', { className: 'announcement-photo-viewer__header' },
        h('strong', null, row.title),
        h('button', { type: 'button', onClick: () => dialog.current.close(), 'aria-label': 'Close photo viewer' }, 'Close')),
      selected !== null && h(FeedPhoto, { React, url: photos[selected], alt: `${row.title} — photo ${selected + 1}` }),
      photos.length > 1 && h('div', { className: 'announcement-photo-viewer__controls' },
        h('button', { type: 'button', onClick: () => setSelected((selected + photos.length - 1) % photos.length) }, 'Previous'),
        h('span', null, `${selected + 1} / ${photos.length}`),
        h('button', { type: 'button', onClick: () => setSelected((selected + 1) % photos.length) }, 'Next'))));
}
