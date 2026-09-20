import assert from 'node:assert/strict';
import { sessionMatchesUser } from '../dist/assets/session-access.js';

const user = { id: 'auth-test-user', email: 'auth@example.test', user_metadata: { role: 'user' } };
const session = { userId: user.id, email: user.email, role: 'user', accessToken: 'test-token', expiresAt: Date.now() / 1000 + 3600 };
assert.equal(sessionMatchesUser(session, user), true);
assert.equal(sessionMatchesUser({ ...session, expiresAt: 1 }, user), false);
assert.equal(sessionMatchesUser({ ...session, userId: 'someone-else' }, user), false);
assert.equal(sessionMatchesUser(session, null), false);
assert.equal(sessionMatchesUser({ ...session, role: 'parish' }, { ...user, user_metadata: { role: 'parish' } }), false);

// Use an isolated browser tab and mock authentication; no live accounts are touched.
const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') console.error(message.params.exceptionDetails);
  if (pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(message.error) : resolve(message.result);
  }
});
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const serial = ++id;
    const timer = setTimeout(() => reject(Error(`Browser timeout: ${method}`)), 15000);
    pending.set(serial, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id: serial, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result.value;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    const scenario = new URL(location.href).searchParams.get('authTest');
    sessionStorage.clear();
    const session = ${JSON.stringify(session)};
    if (scenario === 'expired') session.expiresAt = 1;
    if (scenario === 'expires') session.expiresAt = Date.now()/1000 + 5;
    if (scenario !== 'anonymous') sessionStorage.setItem('diocese-dashboard-db-session', JSON.stringify(session));
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('.supabase.co')) {
        if (url.includes('/auth/v1/user')) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return new Response(JSON.stringify(scenario === 'invalid' ? {message:'Invalid token'} : ${JSON.stringify(user)}), {status: scenario === 'invalid' ? 401 : 200});
        }
        return new Response('[]', {status:200});
      }
      return originalFetch(input, init);
    };
  ` });
  for (const scenario of ['anonymous', 'invalid', 'expired', 'valid', 'expires']) {
    await command('Page.navigate', { url: `http://127.0.0.1:5182/dist/index.html?authTest=${scenario}#user-dashboard` });
    await pause(300);
    assert.equal(await evaluate(`!!document.querySelector('.dashboard-frame')`), false, 'Protected view must not render before validation');
    await pause(3000);
    const allowed = scenario === 'valid' || scenario === 'expires';
    assert.equal(await evaluate(`!!document.querySelector('.dashboard-frame--user')`), allowed, scenario);
    if (!allowed) assert.equal(await evaluate('location.hash'), '#login', scenario);
    if (scenario === 'anonymous') {
      assert.equal(await evaluate(`!!document.querySelector('.login-role-tabs')`), false);
      assert.equal(await evaluate(`!!document.querySelector('#user-login-identifier')`), true);
      assert.equal(await evaluate(`(() => { const s = getComputedStyle(document.querySelector('.login-terms-embed__text')); return s.webkitTextFillColor === s.color && s.color !== 'rgb(255, 255, 255)'; })()`), true, 'Terms text uses readable foreground');
      await evaluate(`document.querySelector('.login-terms-link').click()`);
      assert.equal(await evaluate(`document.querySelector('#login-terms-dialog').open`), true);
      await evaluate(`document.querySelector('#login-terms-dialog').close()`);
      await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 2`), true, 'Mobile login fits');
      await command('Emulation.clearDeviceMetricsOverride');
    }
    if (scenario === 'valid') {
      // Reload must validate the saved session again.
      await command('Page.reload');
      await pause(1700);
      assert.equal(await evaluate(`!!document.querySelector('.dashboard-frame--user')`), true);
      assert.equal(await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(log out|logout)$/i.test(b.textContent.trim())); b?.click(); return !!b; })()`), true);
      await pause(100);
      await evaluate(`document.querySelector('.logout-confirm .primary-action').click()`);
      await pause(150);
      await evaluate(`location.hash='user-dashboard'`);
      await pause(200);
      assert.equal(await evaluate(`!!document.querySelector('.dashboard-frame')`), false, 'Logout blocks reentry');
      assert.equal(await evaluate('location.hash'), '#login');
    }
    if (scenario === 'expires') {
      await pause(2000);
      assert.equal(await evaluate(`!!document.querySelector('.dashboard-frame')`), false);
      assert.equal(await evaluate('location.hash'), '#login');
    }
    console.log(`PASS ${scenario}`);
  }
} finally {
  await command('Page.close');
  socket.close();
}

