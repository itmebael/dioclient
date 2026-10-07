(() => {
  function update() {
    const workspace = document.querySelector('.dashboard-frame--user');
    if (!workspace) return;
    const logo = workspace.querySelector('.sidebar--user .sidebar__crest img');
    if (logo && !logo.src.includes('/logo.png?v=20261007-original')) logo.src = '/dist/assets/logo.png?v=20261007-original';
    const onProfile = location.hash === '#user-profile-settings';
    const profile = onProfile ? workspace.querySelector('.overview-shell:not(.overview-shell--user-dashboard)') : null;
    const preferences = profile?.querySelector('article.member-preferences');
    if (!onProfile) {
      workspace.querySelectorAll('.member-text-settings').forEach(settings => {
        const adjuster = settings.querySelector('#sf-toggle');
        if (adjuster) document.body.append(adjuster);
        settings.remove();
      });
    }
    if (preferences && !preferences.querySelector('.member-text-settings')) {
      const settings = document.createElement('section');
      settings.className = 'member-text-settings';
      settings.innerHTML = '<div class="member-text-settings__controls"></div>';
      preferences.insertBefore(settings, preferences.querySelector('.member-preference-status'));
    }
    const controls = preferences?.querySelector('.member-text-settings__controls');
    const adjuster = document.getElementById('sf-toggle');
    if (controls && adjuster && adjuster.parentElement !== controls) controls.append(adjuster);
    if (location.hash !== '#user-mass-schedules') {
      workspace.querySelectorAll('.mass-bento-grid').forEach(grid => grid.classList.remove('mass-bento-grid'));
      workspace.querySelectorAll('.mass-bento-sunday').forEach(panel => panel.classList.remove('mass-bento-sunday'));
      workspace.querySelectorAll('.mass-bento-daily').forEach(panel => panel.classList.remove('mass-bento-daily'));
    } else {
      const sundayList = workspace.querySelector('.sunday-mass-list');
      const grid = sundayList?.closest('.screen-grid');
      const daily = grid?.querySelector('.daily-mass-container');
      if (grid && daily && !grid.classList.contains('mass-bento-grid')) {
        grid.classList.add('mass-bento-grid');
        sundayList.closest('.user-panel').classList.add('mass-bento-sunday');
        daily.classList.add('mass-bento-daily');
      }
    }
    const dashboard = document.querySelector('.user-home-dashboard');
    if (!dashboard) return;
    const hero = dashboard.querySelector('.user-home-hero');
    if (hero && !hero.hasAttribute('aria-label')) {
      hero.setAttribute('role', 'img');
      hero.setAttribute('aria-label', 'Welcome to Our Lady of the Annunciation Parish, Calbiga, Samar');
    }
    const cards = dashboard.querySelectorAll('.user-home-actions > button');
    const descriptions = ['View and book Masses, sacraments and parish services.', 'Stay updated with the latest news and activities.', 'Request Baptismal, Confirmation, Marriage and other certificates.'];
    cards.forEach((card, index) => {
      if (index > 2 || card.querySelector('.reference-action-description')) return;
      const description = document.createElement('span');
      description.className = 'reference-action-description';
      description.textContent = descriptions[index];
      card.append(description);
      if (index === 2) {
        card.querySelector('strong').textContent = 'Request Certificate';
        card.addEventListener('click', event => {
          event.stopImmediatePropagation();
          const destination = [...document.querySelectorAll('.sidebar__nav .nav-item')].find(item => item.textContent.trim() === 'Request Certificate');
          destination?.click();
        }, true);
      }
    });
  }
  new MutationObserver(update).observe(document.body, {childList:true, subtree:true});
  window.addEventListener('hashchange', update);
  update();
})();
