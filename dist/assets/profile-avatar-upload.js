(() => {
  const supabaseUrl = 'https://lnipoknkbjcxwnggzrnm.supabase.co';
  const anonKey = 'sb_publishable_865CAmJ0g9wUj9dlCo6phQ_l5biuRKK';
  const bucket = 'profile-images';

  function cleanImageUrl(value) {
    let url = String(value || '').trim();
    const markdownLink = url.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (markdownLink) url = markdownLink[2];
    url = url.replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '');
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch { return ''; }
  }

  function attachUploader() {
    const summary = document.querySelector('.user-profile-summary');
    if (!summary || summary.querySelector('.profile-avatar-upload')) return;
    const avatar = summary.querySelector('.user-profile-summary__avatar');
    if (!avatar) return;
    const showAvatar = value => {
      const imageUrl = cleanImageUrl(value);
      if (!imageUrl) return false;
      const image = new Image();
      image.onload = () => {
        avatar.style.backgroundImage = `url(${JSON.stringify(imageUrl)})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.style.backgroundRepeat = 'no-repeat';
      };
      image.src = imageUrl;
      return true;
    };

    const wrap = document.createElement('label');
    wrap.className = 'profile-avatar-upload';
    wrap.innerHTML = '<span>Change profile photo</span><input type="file" accept="image/*" hidden>';
    const status = document.createElement('small');
    status.setAttribute('role', 'status');
    wrap.append(status);
    avatar.after(wrap);

    let savedSession;
    try { savedSession = JSON.parse(sessionStorage.getItem('diocese-dashboard-db-session') || 'null'); } catch {}
    if (savedSession?.accessToken && savedSession?.userId) {
      fetch(`${supabaseUrl}/rest/v1/registered_users?select=avatar_url&id=eq.${encodeURIComponent(savedSession.userId)}&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${savedSession.accessToken}` }
      }).then(response => response.ok ? response.json() : []).then(rows => {
        if (!avatar.isConnected) return;
        showAvatar(rows?.[0]?.avatar_url);
      }).catch(() => {});
    }

    wrap.querySelector('input').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        status.textContent = 'Choose an image under 5 MB.';
        return;
      }
      let session;
      try { session = JSON.parse(sessionStorage.getItem('diocese-dashboard-db-session') || 'null'); } catch {}
      if (!session?.accessToken || !session?.userId) {
        status.textContent = 'Please sign in again to upload a photo.';
        return;
      }
      status.textContent = 'Uploading…';
      try {
        const path = `${session.userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const headers = { apikey: anonKey, Authorization: `Bearer ${session.accessToken}` };
        const upload = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST', headers: { ...headers, 'Content-Type': file.type, 'x-upsert': 'true' }, body: file
        });
        if (!upload.ok) throw new Error(await upload.text());
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
        const update = await fetch(`${supabaseUrl}/rest/v1/registered_users?id=eq.${encodeURIComponent(session.userId)}`, {
          method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ avatar_url: imageUrl })
        });
        if (!update.ok) throw new Error(await update.text());
        showAvatar(imageUrl);
        status.textContent = 'Profile photo updated.';
      } catch (error) {
        status.textContent = `Upload failed: ${error.message || 'Please try again.'}`;
      } finally { event.target.value = ''; }
    });
  }

  new MutationObserver(attachUploader).observe(document.documentElement, { childList: true, subtree: true });
  attachUploader();
})();
