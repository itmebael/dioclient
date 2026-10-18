// Presentation changes only: account forms and dashboard actions remain React-owned.
(() => {
  function update() {
    const intro = document.querySelector('.scene--login .login-card--intro');
    if (intro && !intro.querySelector('.client-reference-logo')) {
      const logo = document.createElement('img');
      logo.className = 'client-reference-logo';
      logo.src = '/dist/assets/admin-brand.png';
      logo.alt = 'ParishLink';
      intro.append(logo);
    }
    const form = document.querySelector('.scene--login .login-card--form:not(.login-card--register)');
    if (form && form.querySelector('input[type="password"]') && !form.closest('.login-shell--register')) {
      const header = form.querySelector('.login-card__header');
      const title = header?.querySelector('h3');
      if (title && /^(Welcome|Sign in|Log in)/i.test(title.textContent)) {
        if (title.textContent !== 'Sign in as Client') title.textContent = 'Sign in as Client';
        if (!header.querySelector('.client-reference-eyebrow')) {
          const eyebrow = document.createElement('p');
          eyebrow.className = 'client-reference-eyebrow';
          eyebrow.textContent = 'WELCOME BACK';
          header.prepend(eyebrow);
        }
      }
    }
    const notificationHeader = document.querySelector('.notification-menu--user .topbar-menu__header');
    if (notificationHeader && !notificationHeader.querySelector('.client-notification-close')) {
      const close = document.createElement('button'); close.type = 'button'; close.className = 'client-notification-close';
      close.setAttribute('aria-label', 'Close notifications'); close.innerHTML = '&times;';
      close.onclick = event => { event.stopPropagation(); document.querySelector('.dashboard-frame--user button[aria-label="Notifications"]')?.click(); };
      notificationHeader.append(close);
    }
    const hero = document.querySelector('.user-home-hero');
    if (hero) {
      hero.removeAttribute('role');
      const title = hero.querySelector('h1,h2,h3,h4');
      if (title && /^Welcome to (the )?/i.test(title.textContent)) title.textContent = title.textContent.replace(/^Welcome to (the )?/i, '');
    }
  }
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }).observe(document.body, { childList: true, subtree: true });
  update();
})();
