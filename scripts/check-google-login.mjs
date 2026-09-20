import assert from 'node:assert/strict';
import { startGoogleLogin, prepareGoogleClient } from '../dist/assets/google-login.js';

let destination;
globalThis.window = { location: { origin: 'http://localhost:5182' }, top: { location: { assign: url => { destination = url; } } } };
await assert.rejects(startGoogleLogin(async () => ({ external: { google: false } }), 'https://example.supabase.co'), /not available yet/);
assert.equal(destination, undefined);
await startGoogleLogin(async () => ({ external: { google: true } }), 'https://example.supabase.co');
const url = new URL(destination);
assert.equal(url.pathname, '/auth/v1/authorize');
assert.equal(url.searchParams.get('provider'), 'google');
assert.equal(url.searchParams.get('redirect_to'), 'http://localhost:5182/dist/index.html');

const client = { id: 'client-id', email: 'client@example.test', user_metadata: { role: 'user' }, app_metadata: { provider: 'google' } };
const unexpected = async () => { throw Error('Unexpected API call'); };
assert.equal(await prepareGoogleClient(client, 'token', unexpected, async () => ({ id: client.id })), client);
await assert.rejects(prepareGoogleClient({ ...client, user_metadata: { role: 'parish' } }, 'token', unexpected, unexpected), /client account/);
let update;
const assigned = await prepareGoogleClient({ ...client, user_metadata: {} }, 'token', async (path, options) => {
  update = { path, options };
  return client;
}, async () => ({ id: client.id }));
assert.equal(assigned, client);
assert.equal(update.path, '/auth/v1/user');
assert.equal(update.options.body.data.role, 'user');
assert.equal(update.options.accessToken, 'token');
console.log('PASS Google provider handling, redirect, client role assignment, existing profile reuse, staff rejection');
