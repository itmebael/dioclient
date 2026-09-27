import fs from 'node:fs';
import assert from 'node:assert/strict';
import {command,evaluate,screenshot,close} from './design-browser.mjs';
const fixtures=fs.readFileSync('scripts/check-heaven-design.mjs','utf8').split('const fixtures = `')[1].split('`;')[0];
await command('Page.enable');
const {identifier}=await command('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{${fixtures}})()`});
const pause=()=>new Promise(r=>setTimeout(r,450));
const route=async name=>{await evaluate(`location.hash=${JSON.stringify(name)}`);await pause();};
try {
  await command('Page.navigate',{url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-dashboard'});
  await command('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,1600));
  await evaluate(`localStorage.removeItem('parishlink-preferences:00000000-0000-4000-8000-000000000001');window.dispatchEvent(new Event('parishlink-preferences'))`);
  await route('user-profile-settings');
  await evaluate(`(()=>{const s=document.querySelector('.member-preferences select');s.value='dark';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause();
  assert.equal(await evaluate(`document.documentElement.dataset.theme`),'dark');
  for(const id of ['member-notifications','member-prayer']) {
    await evaluate(`document.querySelector('[role=switch][aria-labelledby="${id}"]').click()`);await pause();
    assert.equal(await evaluate(`document.querySelector('[role=switch][aria-labelledby="${id}"]').getAttribute('aria-checked')`),'false');
  }
  await route('user-dashboard');assert.equal(await evaluate(`!!document.querySelector('.member-prayer-feed')`),false);
  await command('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,1600));
  await route('user-profile-settings');
  assert.equal(await evaluate(`document.documentElement.dataset.theme`),'dark');
  assert.equal(await evaluate(`document.querySelector('[aria-labelledby="member-notifications"]').getAttribute('aria-checked')`),'false');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await screenshot('preferences-dark');
  await evaluate(`document.querySelector('[aria-labelledby="member-prayer"]').click()`);await pause();
  await route('user-dashboard');assert.equal(await evaluate(`!!document.querySelector('.member-prayer-feed')`),true);
  const isolated=await evaluate(`(async()=>{const m=await import('/dist/assets/member-preferences.js');return m.readPreferences({userId:'another-member'});})()`);
  assert.deepEqual(isolated,{theme:'light',notifications:true,prayerFeed:true});
  await route('user-profile-settings');
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});await pause();
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
  await evaluate(`localStorage.removeItem('parishlink-preferences:00000000-0000-4000-8000-000000000001');window.dispatchEvent(new Event('parishlink-preferences'))`);
  console.log('Theme, toggles, persistence, account isolation, prayer-card visibility and mobile layout passed.');
} finally {await command('Page.removeScriptToEvaluateOnNewDocument',{identifier});close();}
