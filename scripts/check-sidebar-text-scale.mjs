import fs from 'node:fs';
import assert from 'node:assert/strict';
import { command, evaluate, screenshot, close } from './design-browser.mjs';

const fixtures = fs.readFileSync('scripts/check-heaven-design.mjs', 'utf8').split('const fixtures = `')[1].split('`;')[0];
await command('Page.enable');
await command('Runtime.enable');
const { identifier } = await command('Page.addScriptToEvaluateOnNewDocument', { source: fixtures });
try {
  await command('Page.navigate', { url: 'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-dashboard' });
  await command('Page.reload', { ignoreCache: true });
  await new Promise(resolve => setTimeout(resolve, 1800));
  const results = [];
  for (const [width, height] of [[1440,900], [1024,600], [768,600], [390,844], [320,568], [844,390]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 700 });
    if (width <= 700) await evaluate(`document.querySelector('.user-topbar-menu').click()`);
    for (const scale of [1, 1.3, 2, 2.8]) {
      await evaluate(`document.documentElement.style.setProperty('--sf-scale','${scale}');document.documentElement.style.fontSize='${16*scale}px'`);
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await evaluate(`(() => {
        const sidebar=document.querySelector('.sidebar--user'),nav=sidebar.querySelector('.sidebar__nav'),logout=sidebar.querySelector('.nav-item--logout'),pill=document.querySelector('#sf-toggle');
        const rect=logout.getBoundingClientRect(),side=sidebar.getBoundingClientRect();
        const buttons=[...nav.querySelectorAll('button')];
        const reachable=buttons.every(button=>{const b=button.getBoundingClientRect(),n=nav.getBoundingClientRect(),label=button.querySelector('span:last-child').getBoundingClientRect();return b.bottom<=n.bottom+1&&b.top>=n.top-1&&label.bottom<=b.bottom+1&&label.top>=b.top-1;});
        return {visible:getComputedStyle(logout).display!=='none'&&rect.top>=0&&rect.bottom<=innerHeight,adjusterHidden:!pill||getComputedStyle(pill).display==='none',sidebarFits:side.right<=innerWidth+1,navFits:nav.scrollWidth<=nav.clientWidth+1&&nav.scrollHeight<=nav.clientHeight+1,reachable,fontSize:parseFloat(getComputedStyle(buttons[0].querySelector('span:last-child')).fontSize)};
      })()`);
      results.push({width,height,scale,...state});
      assert.ok(state.visible && state.adjusterHidden && state.sidebarFits && state.navFits && state.reachable, JSON.stringify(results.at(-1)));
    }
    if (width===390) await screenshot('sidebar-large-text');
    if (width<=700) await evaluate(`document.querySelector('.sidebar-overlay').click()`);
  }
  await evaluate(`location.hash='user-profile-settings'`);
  await new Promise(resolve => setTimeout(resolve, 2400));
  assert.ok(await evaluate(`!!document.querySelector('article.member-preferences .member-text-settings #sf-toggle')`));
  assert.equal(await evaluate(`document.querySelector('.member-text-settings').textContent.includes('Display settings')`), false);
  await evaluate(`document.getElementById('sf-toggle__reset').click();document.getElementById('sf-toggle__plus').click()`);
  assert.equal(await evaluate(`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sf-scale'))`), 1.4);
  await evaluate(`document.getElementById('sf-toggle__reset').click()`);
  await evaluate(`location.hash='user-dashboard'`);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(await evaluate(`document.querySelectorAll('.member-text-settings').length`), 0);
  assert.ok(await evaluate(`getComputedStyle(document.getElementById('sf-toggle')).display==='none'`));
  console.log(JSON.stringify({checks:results.length,settingsAdjusterWorks:true,passed:true},null,2));
} finally {
  await command('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  close();
}
