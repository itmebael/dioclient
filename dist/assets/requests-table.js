import { RequestProgress } from './request-progress.js';

// Reconstructed because the source archive omitted this module.
export function RequestsTable({ React, rows = [], loading, error, onCancel, onDelete }) {
  const h = React.createElement;
  const [busy, setBusy] = React.useState(null);
  const [actionError, setActionError] = React.useState('');
  async function act(row, callback, verb) {
    if (busy || !callback || !window.confirm(`${verb} this request?`)) return;
    setBusy(row.id);
    setActionError('');
    try { await callback(row); }
    catch (err) { setActionError(err?.message || 'The request could not be updated. Please try again.'); }
    finally { setBusy(null); }
  }
  const date = value => {
    const parsed = new Date(value);
    return value && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : '—';
  };
  return h('div', { className: 'user-request-booking-list' },
    actionError ? h('p', { role: 'alert' }, actionError) : null,
    !rows.length && !loading && !error ? h('p', { className: 'user-empty-state' }, 'No requests yet.') : null,
    ...rows.map(row => {
      const status = String(row.booking_status || 'Submitted');
      const cancellable = /^(submitted|pending|pending parish review|appointment|booked|saved)$/i.test(status);
      const deletable = /^(cancelled|declined|rejected|disapproved)$/i.test(status);
      return h('article', { key: row.id, className: 'user-request-card' },
        h('div', { className: 'user-request-card__header' },
          h('h4', null, row.service_name || 'Parish service request'),
          h('span', { className: 'user-request-status' }, status)),
        h('p', null, row.reference_number || 'Reference pending'),
        h('p', null, [row.client_name, row.parish_name].filter(Boolean).join(' · ')),
        h('p', null, 'Submitted: ', date(row.created_at)),
        h(RequestProgress, { React, row }),
        row.certificate_file_url && /^https?:\/\//i.test(row.certificate_file_url)
          ? h('a', { href: row.certificate_file_url, target: '_blank', rel: 'noopener noreferrer' }, 'View certificate') : null,
        h('div', { className: 'user-request-card__actions' },
          cancellable && onCancel ? h('button', { type: 'button', disabled: busy !== null, onClick: () => act(row, onCancel, 'Cancel') }, busy === row.id ? 'Updating…' : 'Cancel request') : null,
          deletable && onDelete ? h('button', { type: 'button', disabled: busy !== null, onClick: () => act(row, onDelete, 'Delete') }, busy === row.id ? 'Updating…' : 'Delete request') : null));
    }));
}
