import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const preview = fs.readFileSync('dist/assets/preview-user.js', 'utf8');
const key = 'diocese-dashboard-db-session';
function run({ hostname = 'localhost', search = '', session } = {}) {
  const storage = new Map(session ? [[key, JSON.stringify(session)]] : []);
  const fetch = async () => 'live';
  const context = {
    location: { hostname, search, hash: '#user-dashboard' },
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    localStorage: { setItem() {} },
    window: { fetch }, URLSearchParams, URL, Response,
  };
  vm.runInNewContext(preview, context);
  return { session: JSON.parse(storage.get(key) ?? 'null'), mocked: context.window.fetch !== fetch };
}

assert.deepEqual(run(), { session: null, mocked: false });
const realSession = { role: 'user', accessToken: 'real-user-token', userId: 'member-id' };
for (const search of ['', '?previewRole=user']) {
  assert.deepEqual(run({ search, session: realSession }), { session: realSession, mocked: false });
}
assert.deepEqual(run({ session: { accessToken: 'local-preview-only' } }), { session: null, mocked: false });
assert.deepEqual(run({ hostname: 'parish.example', search: '?previewRole=user' }), { session: null, mocked: false });
const explicitPreview = run({ search: '?previewRole=user' });
assert.equal(explicitPreview.session.accessToken, 'local-preview-only');
assert.equal(explicitPreview.mocked, true);

const html = fs.readFileSync('dist/index.html', 'utf8');
const app = fs.readFileSync('dist/assets/index-v20260422157000.js', 'utf8');
assert.ok(!html.includes('rebuilt-dashboard.html'));
assert.ok(!app.includes('rebuilt-dashboard.html'));
assert.ok(app.includes('ln(z),Ns(z),r(p.destination)'));
console.log('Passed: live login handoff, dashboard reload, real-session preservation, stale preview cleanup, and explicit local preview.');
