import fs from 'node:fs';
import assert from 'node:assert/strict';
import {command, evaluate, screenshot, close, browserErrors} from './design-browser.mjs';

// Use isolated preview fixtures; no live account or database transactions.
const fixtures = fs.readFileSync('scripts/check-heaven-design.mjs', 'utf8').split('const fixtures = `')[1].split('`;')[0];
const pause = () => new Promise(resolve => setTimeout(resolve, 300));
await command('Page.enable');
await command('Runtime.enable');
const {identifier} = await command('Page.addScriptToEvaluateOnNewDocument', {source: `(()=>{${fixtures}})()`});
try {
  await command('Emulation.setDeviceMetricsOverride', {width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate', {url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-certificate'});
  await command('Page.reload', {ignoreCache:true});
  await new Promise(resolve => setTimeout(resolve, 1600));
  const visiblePanels = `Array.from(document.querySelectorAll('[role="tabpanel"]')).filter(p=>getComputedStyle(p).display!=='none')`;
  assert.equal(await evaluate(`document.querySelectorAll('.certificate-tabs [role="tab"]').length`), 5);
  assert.equal(await evaluate(`${visiblePanels}.length`), 1);
  for (let index=0;index<5;index++) {
    await evaluate(`document.querySelectorAll('.certificate-tabs [role="tab"]')[${index}].click()`);
    await pause();
    assert.equal(await evaluate(`${visiblePanels}.length`), 1);
    assert.ok(await evaluate(`(()=>{const tab=document.querySelector('.certificate-tabs [aria-selected="true"]'); const panel=${visiblePanels}[0];return tab.id===panel.getAttribute('aria-labelledby')&&tab.getAttribute('aria-controls')===panel.id;})()`));
    await evaluate(`${visiblePanels}[0].querySelector('button').click()`);
    await pause();
    assert.ok(await evaluate(`document.querySelector('.certificate-booking-modal__service strong').textContent===document.querySelector('.certificate-tabs [aria-selected="true"]').textContent`));
    await evaluate(`document.querySelector('.certificate-booking-modal__close').click()`);
  }
  for (const [key,expected] of [['Home',0],['ArrowRight',1],['End',4],['ArrowRight',0],['ArrowLeft',4]]) {
    await evaluate(`document.querySelector('.certificate-tabs [aria-selected="true"]').dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(key)},bubbles:true}))`);
    await pause();
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.certificate-tabs [role="tab"]')).indexOf(document.activeElement)`), expected);
  }
  for (const [query,count] of [['Marriage',1],['not-a-service',0],['',5]]) {
    await evaluate(`(()=>{const input=document.querySelector('.ucs-input');input.value=${JSON.stringify(query)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await pause();
    assert.equal(await evaluate(`document.querySelectorAll('.certificate-tabs [role="tab"]:not([hidden])').length`), count);
    assert.equal(await evaluate(`${visiblePanels}.length`), count ? 1 : 0);
  }
  for (const width of [320,390,768,1440]) {
    await command('Emulation.setDeviceMetricsOverride', {width,height:1100,deviceScaleFactor:1,mobile:width<901});
    await pause();
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), `Overflow at ${width}px`);
    if(width===390||width===1440) await screenshot(`certificate-tabs-${width}`);
  }
  await evaluate(`location.hash='user-dashboard'`); await pause();
  await evaluate(`location.hash='user-certificate'`); await pause();
  assert.equal(await evaluate(`${visiblePanels}.length`),1);
  assert.deepEqual(browserErrors, []);
  console.log('Certificate tabs passed: five booking flows, keyboard navigation, search, empty results, four viewport widths, and route return.');
} finally {
  await command('Page.removeScriptToEvaluateOnNewDocument', {identifier});
  close();
}
