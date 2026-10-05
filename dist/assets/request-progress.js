export function requestProgress(row) {
  const status = String(row.booking_status || 'Submitted').trim();
  const normalized = status.toLowerCase();
  const appointment = String(row.reference_number || '').startsWith('APT-') || ['appointment', 'confirmed'].includes(normalized);
  const stopped = ['cancelled', 'declined', 'disapproved', 'rejected', 'correction'].includes(normalized);
  const ready = Boolean(row.certificate_file_url) || ['certificate ready', 'ready', 'released', 'completed'].includes(normalized);
  const approved = ['approved', 'confirmed'].includes(normalized);
  const steps = appointment ? ['Submitted', 'Parish review', 'Approved'] : ['Submitted', 'Parish review', 'Certificate ready'];
  const current = stopped ? 1 : ready || (appointment && approved) ? 2 : 1;
  return { status: normalized === 'appointment' || normalized === 'booked' || normalized === 'saved' ? 'Pending parish review' : status, steps, current, stopped };
}

export function RequestProgress({ React, row }) {
  const h = React.createElement;
  const progress = requestProgress(row);
  return h('div', { className: 'request-progress', 'aria-label': `Request status: ${progress.status}` },
    h('div', { className: 'request-progress__status' }, h('span', null, 'Status'), h('strong', null, progress.status)),
    h('ol', { className: 'request-progress__line' }, progress.steps.map((label, index) =>
      h('li', { key: label, className: `${index < progress.current ? 'is-complete' : ''} ${index === progress.current ? (progress.stopped ? 'is-stopped' : 'is-current') : ''}`, 'aria-current': index === progress.current ? 'step' : undefined },
        h('span', { className: 'request-progress__dot', 'aria-hidden': true }),
        h('span', null, index === progress.current && progress.stopped ? progress.status : label)))));
}
