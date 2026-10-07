import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fetchMemberRequests } from '../dist/assets/member-requests.js';
import { command, evaluate, screenshot, close } from './design-browser.mjs';

const userId = '00000000-0000-4000-8000-000000000001';
const rows = [
  { id:'own-appointment',booked_by:userId,reference_number:'APT-20260428-OWN',service_name:'Certificate pickup',booking_status:'Confirmed',created_at:'2026-04-28',client_name:'Maria Santos',parish_name:'Preview parish' },
  { id:'own-certificate',booked_by:userId,reference_number:'CERT-20260428-OWN',service_name:'Baptismal Certificate',booking_status:'Released',created_at:'2026-04-27',client_name:'Maria Santos',parish_name:'Preview parish' },
  { id:'other-request',booked_by:'00000000-0000-4000-8000-000000000002',reference_number:'CERT-OTHER',service_name:'Other member request',booking_status:'Pending',created_at:'2026-04-29' },
];
let queries = [];
const fetchRows = async (table, query, token) => {
  assert.equal(table, 'diocese_service_bookings');
  assert.equal(token, 'member-token');
  const params = new URLSearchParams(query);
  assert.equal(params.get('booked_by'), `eq.${userId}`);
  assert.equal(params.get('select'), '*');
  queries.push(params);
  return rows.filter(row => row.booked_by === userId).slice(0, Number(params.get('limit')) || undefined);
};
assert.equal((await fetchMemberRequests({ userId,accessToken:'member-token',fetchRows,limit:3 })).length, 2);
assert.equal((await fetchMemberRequests({ userId,accessToken:'member-token',fetchRows })).length, 2);
assert.equal(queries[0].get('limit'), '3');
assert.equal(queries[1].get('limit'), null);
await assert.rejects(fetchMemberRequests({ userId:null,accessToken:'member-token',fetchRows }), /log in again/);
await assert.rejects(fetchMemberRequests({ userId,accessToken:null,fetchRows }), /log in again/);
let attempts = 0;
await assert.rejects(fetchMemberRequests({ userId,accessToken:'member-token',fetchRows:async () => { attempts++; throw Error('Request unavailable'); } }), /Request unavailable/);
assert.equal(attempts, 1, 'Do not retry personal requests anonymously');

await command('Page.enable');
await command('Runtime.enable');
const base = fs.readFileSync('scripts/check-heaven-design.mjs','utf8').split('const fixtures = `')[1].split('`;')[0];
const fixture = base + `
  const bookingRows = ${JSON.stringify(rows)};
  const baseFetch = window.fetch;
  window.__memberRequestQueries = [];
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/rest/v1/diocese_service_bookings?') && (!init?.method || init.method === 'GET')) {
      const params = new URL(url).searchParams;
      window.__memberRequestQueries.push(params.get('booked_by'));
      const owner = params.get('booked_by')?.replace(/^eq\\./,'');
      const result = bookingRows.filter(row => !owner || row.booked_by === owner).slice(0, Number(params.get('limit')) || undefined);
      return new Response(JSON.stringify(result), {status:200,headers:{'Content-Type':'application/json'}});
    }
    return baseFetch(input, init);
  };
`;
const {identifier} = await command('Page.addScriptToEvaluateOnNewDocument', {source:fixture});
try {
  await command('Page.navigate', {url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-dashboard'});
  await command('Page.reload', {ignoreCache:true});
  await new Promise(resolve => setTimeout(resolve,1800));
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  const recent = await evaluate(`document.querySelector('.user-home-card--requests').textContent`);
  assert.ok(recent.includes('APT-20260428-OWN') && recent.includes('CERT-20260428-OWN'));
  assert.ok(!recent.includes('CERT-OTHER'));
  const alignment = await evaluate(`getComputedStyle(document.querySelector('.user-request-status')).justifyContent`);
  assert.equal(alignment, 'center');
  await evaluate(`location.hash='user-my-requests'`);
  await new Promise(resolve => setTimeout(resolve,400));
  assert.equal(await evaluate(`document.querySelectorAll('.user-request-card').length`), 2);
  const requests = await evaluate(`document.querySelector('.user-request-booking-list').textContent`);
  assert.ok(requests.includes('APT-20260428-OWN') && requests.includes('CERT-20260428-OWN'));
  assert.ok(!requests.includes('CERT-OTHER'));
  assert.ok(await evaluate(`window.__memberRequestQueries.every(owner => owner === 'eq.${userId}')`));
  await screenshot('my-requests-owned-records');
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`));
  console.log('Both views show the same two owned requests; other accounts are excluded; statuses centered.');
} finally {
  await command('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  close();
}
