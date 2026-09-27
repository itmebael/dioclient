(() => {
  const labels = {
    overview: 'Dashboard',
    services: 'Certificates & Appointments',
    schedule: 'Mass Schedules',
    live: 'Live Stream',
    announcements: 'Parish Announcements',
    requests: 'My Requests',
    profile: 'Edit Profile',
    support: 'Send us a Message',
  };
  const pages = [...document.querySelectorAll('[data-page]')];
  const links = [...document.querySelectorAll('[data-view]')];
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menuButton');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const toast = document.getElementById('toast');
  const logoutDialog = document.getElementById('logoutDialog');
  const logoutButton = document.getElementById('logoutButton');
  const requestDetailsDialog = document.getElementById('requestDetailsDialog');
  const notificationButton = document.getElementById('notificationButton');
  const notificationDropdown = document.getElementById('notificationDropdown');
  let toastTimer;

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  function navigate(view, updateHash = true) {
    if (!labels[view]) return;
    pages.forEach(page => page.classList.toggle('active', page.dataset.page === view));
    links.forEach(link => link.classList.toggle('active', link.classList.contains('nav-link') && link.dataset.view === view));
    closeSidebar();
    if (updateHash) {
      const hash = view === 'overview' ? 'user-dashboard' : `user-${view}`;
      history.replaceState(null, '', `#${hash}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
  }

  links.forEach(link => link.addEventListener('click', () => {
    navigate(link.dataset.view);
    notificationDropdown.hidden = true;
    notificationButton.setAttribute('aria-expanded', 'false');
  }));
  notificationButton.addEventListener('click', event => {
    event.stopPropagation();
    notificationDropdown.hidden = !notificationDropdown.hidden;
    notificationButton.setAttribute('aria-expanded', String(!notificationDropdown.hidden));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.notification-wrap')) {
      notificationDropdown.hidden = true;
      notificationButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !notificationDropdown.hidden) {
      notificationDropdown.hidden = true;
      notificationButton.setAttribute('aria-expanded', 'false');
      notificationButton.focus();
    }
  });
  logoutButton.addEventListener('click', () => logoutDialog.showModal());
  document.getElementById('cancelLogout').addEventListener('click', () => logoutDialog.close());
  document.getElementById('confirmLogout').addEventListener('click', () => {
    logoutDialog.close();
    location.href = '/dist/index.html#login';
  });
  function showRequestDetails(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;
    document.getElementById('detailRequestName').textContent = cells[0].textContent.trim();
    document.getElementById('detailRequestRef').textContent = cells[1].textContent.trim();
    document.getElementById('detailRequestDate').textContent = cells[2].textContent.trim();
    const status = cells[3].querySelector('span');
    const statusDisplay = document.getElementById('detailRequestStatus');
    statusDisplay.textContent = status ? status.textContent.trim() : cells[3].textContent.trim();
    statusDisplay.className = status?.className || 'review-pill';
    requestDetailsDialog.showModal();
  }
  document.querySelectorAll('[data-request-row]').forEach(row => {
    row.addEventListener('click', () => showRequestDetails(row));
    row.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showRequestDetails(row);
      }
    });
  });
  document.querySelectorAll('[data-close-request]').forEach(button => button.addEventListener('click', () => requestDetailsDialog.close()));
  backdrop.addEventListener('click', closeSidebar);
  menuButton.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    backdrop.classList.toggle('visible', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => {
    showToast('This is a dashboard preview. Sign-in is needed to submit a real request.');
  }));

  const route = location.hash.replace(/^#/, '');
  const requested = route === 'user-dashboard' ? 'overview' : route.startsWith('user-') ? route.slice(5) : route;
  const initial = ['certificates', 'appointments'].includes(requested) ? 'services' : requested;
  navigate(labels[initial] ? initial : 'overview', false);
})();
