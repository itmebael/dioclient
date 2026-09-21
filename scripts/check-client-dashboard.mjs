import fs from 'node:fs';
import assert from 'node:assert/strict';
import {command,evaluate,screenshot,close,browserErrors} from '../scripts/design-browser.mjs';
await command('Page.enable'); await command('Runtime.enable');
const source=fs.readFileSync('scripts/check-heaven-design.mjs','utf8').split('const fixtures = `')[1].split('`;')[0];
const {identifier}=await command('Page.addScriptToEvaluateOnNewDocument',{source:'(()=>{'+source+'})()'});
const pause=()=>new Promise(r=>setTimeout(r,250));
try {
 await command('Page.navigate',{url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-dashboard'});
 await command('Page.reload',{ignoreCache:true}); await new Promise(r=>setTimeout(r,1800));
 const results=[];
 for(const width of [320,390,768,900,1024,1440,1920]) {
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<901});
  for(const route of ['user-dashboard','user-certificate','user-mass-schedules','user-appointments','user-my-requests','user-profile-settings','user-announcement','user-help-support','user-correction']) {
   await evaluate(`location.hash=${JSON.stringify(route)};window.scrollTo(0,0)`); await pause();
   const state=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth+1,content:!!document.querySelector('.overview-shell')})`);
   results.push({width,route,...state});
  }
  await evaluate(`location.hash='user-dashboard'`); await pause();
  if([390,768,1440].includes(width))await screenshot('dashboard-new-'+width);
  if(width===390){
   await evaluate(`document.querySelector('.user-topbar-menu').click()`); await pause();
   assert.ok(await evaluate(`document.querySelector('.sidebar').classList.contains('is-open')`));
   await screenshot('dashboard-new-drawer');
   await evaluate(`document.querySelector('.sidebar-overlay').click()`); await pause();
   assert.ok(await evaluate(`!document.querySelector('.sidebar').classList.contains('is-open')`));
   for(const [index,route] of ['user-dashboard','user-my-requests','user-mass-schedules','user-profile-settings'].entries()) {
    await evaluate(`document.querySelectorAll('.client-bottom-nav button')[${index}].click()`); await pause();
    assert.equal(await evaluate('location.hash'),'#'+route);
    assert.equal(await evaluate(`document.querySelectorAll('.client-bottom-nav [aria-current="page"]').length`),1);
   }
  }
 }
 console.log(JSON.stringify({checks:results.length,failures:results.filter(x=>x.overflow||!x.content),browserErrors},null,2));
 assert.ok(results.every(x=>!x.overflow&&x.content));
 assert.equal(browserErrors.length,0);
}finally{await command('Page.removeScriptToEvaluateOnNewDocument',{identifier});close();}
