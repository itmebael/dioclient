import {fetchMemberRequests} from './member-requests.js';

export function deliveredCertificate(row) {
  return /^https:\/\//i.test(row.certificate_file_url || '') &&
    /^(released|completed|certificate ready|ready for release)$/i.test(String(row.booking_status || '').trim());
}
export function deliveryKey(row) {
  return [row.id, row.certificate_uploaded_at || row.updated_at || row.certificate_file_url].join(':');
}
export function declinedBooking(row) {
  return /^(declined|rejected|disapproved)$/i.test(String(row.booking_status || '').trim());
}
export function bookingNoticeKey(row) {
  return declinedBooking(row) ? [row.id, 'declined', row.updated_at || row.created_at || ''].join(':') : deliveryKey(row);
}
export function useCertificateDelivery(React, session, fetchRows) {
  const userId = session?.userId || session?.user?.id;
  const token = session?.accessToken;
  React.useEffect(() => {
    if (session?.role !== 'user' || !userId || !token) return;
    let stopped = false, running = false, dialog = null;
    const storageKey = 'parishlink-certificate-deliveries:' + userId;
    let seen;
    try {seen = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));} catch {seen = new Set();}
    function show(row) {
      const key = bookingNoticeKey(row);
      const declined = declinedBooking(row);
      dialog = document.createElement('dialog');
      dialog.className = 'client-certificate-delivery';
      dialog.setAttribute('aria-labelledby', 'certificate-delivery-title');
      const title = document.createElement('h2');
      title.id = 'certificate-delivery-title';
      title.textContent = declined ? 'Your booking was declined' : 'Your certificate is ready';
      const message = document.createElement('p');
      message.textContent = (row.service_name || 'Parish service') + ' — ' + (row.reference_number || '') + (declined ? '. The parish has declined this booking. Open My Bookings to review the status, or contact the parish office for assistance.' : '. The parish has sent your certificate. Your booking is now Released.');
      const actions = document.createElement('div');
      const view = document.createElement('button');
      view.type = 'button';view.textContent = 'View My Bookings';
      view.className = 'primary-action';
      const close = document.createElement('button');
      close.type = 'button';close.textContent = 'Close';close.className = 'secondary-action';
      function dismiss() {if (!dialog) return;dialog.close();dialog.remove();dialog = null;}
      view.addEventListener('click', () => {window.location.hash = 'user-my-requests';dismiss();});
      close.addEventListener('click', dismiss);
      dialog.addEventListener('cancel', event => {event.preventDefault();dismiss();});
      actions.append(view, close);dialog.append(title, message, actions);document.body.append(dialog);
      dialog.showModal();
      seen.add(key);
      try {localStorage.setItem(storageKey, JSON.stringify([...seen].slice(-500)));} catch {}
    }
    async function tick() {
      if (stopped || running || document.visibilityState === 'hidden') return;
      running = true;
      try {
        const rows = await fetchMemberRequests({userId, accessToken:token, fetchRows});
        if (stopped) return;
        window.dispatchEvent(new CustomEvent('member-bookings-updated', {detail:{userId, rows}}));
        const ready = rows.filter(row => deliveredCertificate(row) || declinedBooking(row)).filter(row => !seen.has(bookingNoticeKey(row)))
          .sort((a,b) => String(b.updated_at || b.certificate_uploaded_at || b.created_at || '').localeCompare(String(a.updated_at || a.certificate_uploaded_at || a.created_at || '')));
        if (!dialog && ready.length) show(ready[0]);
      } catch { /* Keep the last good bookings; retry on the next poll. */ }
      finally {running = false;}
    }
    tick();
    const timer = window.setInterval(tick, 5000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {stopped = true;window.clearInterval(timer);window.removeEventListener('focus', tick);document.removeEventListener('visibilitychange', tick);if (dialog) {dialog.close();dialog.remove();}};
  }, [session?.role, userId, token]);
}
