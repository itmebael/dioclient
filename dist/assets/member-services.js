export function MemberServices({ React, onNavigate }) {
  const h = React.createElement;
  const items = [
    ['Baptismal Certificate', 'Request a certified copy of a baptismal record.', 'user-certificate', 'blue'],
    ['Confirmation Certificate', 'Request your confirmation record.', 'user-certificate', 'green'],
    ['Marriage Certificate', 'Request a certified copy of a marriage record.', 'user-certificate', 'coral'],
    ['Book an Appointment', 'Schedule a visit to the parish office.', 'user-appointments', 'purple'],
  ];
  return h('section', { className: 'member-service-grid', 'aria-label': 'Certificates and appointments' },
    items.map(([title, description, route, tone]) => h('button', {
      key: title, type: 'button', className: `member-service-tile member-service-tile--${tone}`,
      onClick: () => onNavigate(route),
    }, h('span', { className: 'member-service-icon', 'aria-hidden': true },
      h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
        h('path', { d: route === 'user-appointments' ? 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2' : 'M14 2H6v20h12V6zM14 2v5h4M9 12h6M9 16h6' }))),
      h('strong', null, title), h('small', null, description))));
}
