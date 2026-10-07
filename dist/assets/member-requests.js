// Both member request views use the same authenticated ownership filter.
export async function fetchMemberRequests({ userId, accessToken, fetchRows, limit }) {
  if (!userId || !accessToken) {
    throw new Error('Please log in again to load your requests.');
  }
  const query = [
    'select=*',
    `booked_by=eq.${encodeURIComponent(userId)}`,
    'order=created_at.desc',
    Number.isInteger(limit) && limit > 0 ? `limit=${limit}` : '',
  ].filter(Boolean).join('&');
  // Use the authenticated reader directly; never retry personal records anonymously.
  const rows = await fetchRows('diocese_service_bookings', query, accessToken);
  return Array.isArray(rows) ? rows : [];
}
