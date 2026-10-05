import { ADDRESS_OPTIONS } from './address-options.js';

export async function startGoogleLogin(request, baseUrl) {
  const settings = await request('/auth/v1/settings');
  if (!settings?.external?.google) {
    throw new Error('Google sign-in is not available yet. Please use email and password for now.');
  }
  const redirect = new URL('/dist/index.html', window.location.origin);
  const authorize = new URL('/auth/v1/authorize', baseUrl);
  authorize.searchParams.set('provider', 'google');
  authorize.searchParams.set('redirect_to', redirect.href);
  authorize.searchParams.set('scopes', 'openid email profile');
  // Google authorization must open outside the dashboard iframe.
  window.top.location.assign(authorize.href);
}

export async function prepareGoogleClient(user, token, request, findProfile) {
  const metadata = user?.user_metadata || {};
  if (metadata.role && metadata.role !== 'user') throw new Error('Please sign in with a client account.');
  const isGoogle = user?.app_metadata?.provider === 'google' ||
    user?.app_metadata?.providers?.includes('google');
  if (!isGoogle) return user;
  if (!metadata.role) {
    user = await request('/auth/v1/user', {
      method: 'PUT', accessToken: token,
      body: { data: { role: 'user', display_name: metadata.full_name || metadata.name || user.email } },
    });
  }
  if (!await findProfile(user.email, token, user.id)) {
    const parishes = await request('/rest/v1/parishes?select=id,parish_name&order=parish_name.asc', { accessToken: token });
    await completeGoogleProfile(user, token, request, parishes);
  }
  return user;
}

function completeGoogleProfile(user, token, request, parishes) {
  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'google-profile-dialog';
    dialog.setAttribute('aria-labelledby', 'google-profile-title');
    dialog.innerHTML = `<form class="google-profile-form">
      <h2 id="google-profile-title">Complete your client profile</h2>
      <p>Choose your parish and add your details to finish signing in.</p>
      <label>Full name<input name="full_name" autocomplete="name" required></label>
      <label>Parish<select name="parish_id" required><option value="">Choose your parish</option></select></label>
      <label>Phone number<input name="phone_number" type="tel" autocomplete="tel" required></label>
      <label>Birthdate<input name="birthdate" type="date" required></label>
      <label>Address<select name="address" required><option value="">Select your address</option></select></label>
      <label class="google-profile-address-other" hidden>Please specify your address<input name="address_other" autocomplete="street-address" disabled></label>
      <label>Civil status<select name="civil_status" required><option value="">Choose your status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></label>
      <p role="alert" class="google-profile-error"></p>
      <button type="submit">Continue to dashboard</button>
      <button type="button" class="google-profile-cancel">Cancel</button>
    </form>`;
    const form = dialog.querySelector('form');
    for (const address of ADDRESS_OPTIONS) {
      form.elements.address.add(new Option(address, address));
    }
    form.elements.address.add(new Option('Others: (Please specify)', '__other__'));
    const otherAddress = form.elements.address_other;
    form.elements.address.addEventListener('change', () => {
      const isOther = form.elements.address.value === '__other__';
      dialog.querySelector('.google-profile-address-other').hidden = !isOther;
      otherAddress.disabled = !isOther;
      otherAddress.required = isOther;
      otherAddress.setCustomValidity('');
    });
    otherAddress.addEventListener('input', () => otherAddress.setCustomValidity(''));
    form.elements.full_name.value = user.user_metadata?.display_name || user.user_metadata?.full_name || '';
    for (const parish of Array.isArray(parishes) ? parishes : []) {
      form.elements.parish_id.add(new Option(parish.parish_name, parish.id));
    }
    const cancel = () => { dialog.remove(); reject(new Error('Google sign-in was cancelled.')); };
    dialog.addEventListener('cancel', event => { event.preventDefault(); cancel(); });
    dialog.querySelector('.google-profile-cancel').onclick = cancel;
    form.onsubmit = async event => {
      event.preventDefault();
      const profile = Object.fromEntries(new FormData(form));
      if (profile.address === '__other__') {
        profile.address = otherAddress.value.trim();
        if (!profile.address) {
          otherAddress.setCustomValidity('Please specify your address.');
          otherAddress.reportValidity();
          return;
        }
      }
      delete profile.address_other;
      const submit = form.querySelector('[type=submit]');
      submit.disabled = true;
      try {
        await request('/rest/v1/registered_users', {
          method: 'POST', accessToken: token,
          body: { ...profile, id: user.id, email: user.email, profile_picture_url: null },
        });
        dialog.remove();
        resolve();
      } catch (error) {
        dialog.querySelector('[role=alert]').textContent = error.message || 'Could not save your profile. Please try again.';
        submit.disabled = false;
      }
    };
    document.body.append(dialog);
    dialog.showModal();
  });
}
