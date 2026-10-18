import fs from 'node:fs';
import assert from 'node:assert/strict';
import {command,evaluate,screenshot,close,browserErrors} from './admin-match-browser.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await command('Page.enable');await command('Runtime.enable');
 const fixtures=fs.readFileSync('scripts/check-heaven-design.mjs','utf8').split('const fixtures = `')[1].split('`;')[0];
 const posts=`const postsFetch=window.fetch;window.postQueries=[];window.fetch=async(input,init)=>{const url=String(input.url||input);if(url.includes('/diocese_announcements?')){window.postQueries.push(url);if(window.failAnnouncements)throw new Error('Test loading failure');return new Response(JSON.stringify(window.emptyPosts?[]:[{id:'notice',title:'Parish activities',content:'2026-10-20\\tParish assembly\\n2026-10-21\\tYouth formation',created_at:'2026-10-13',category:'Notice',photo_urls:['http://127.0.0.1:5181/logo.png']},{id:'legacy',title:'Office notice',content:'Office closes at noon.',created_at:'2026-10-12',category:'Notice'}]),{headers:{'Content-Type':'application/json'}})}if(url.includes('/parish_bulletins?')){window.postQueries.push(url);return new Response(JSON.stringify(window.emptyPosts?[]:[{id:'bulletin',title:'Community project update',content:'New roof completed.',category:'Project transparency',published_at:'2026-10-13'}]),{headers:{'Content-Type':'application/json'}})}return postsFetch(input,init)};`;
 await command('Page.addScriptToEvaluateOnNewDocument',{source:'(()=>{'+fixtures+posts+'})()'});
 await command('Page.navigate',{url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-announcement'});await pause(1800);
 assert.equal(await evaluate('document.querySelectorAll(".member-post-tabs [role=tab]").length'),2);
 assert.ok(await evaluate('document.querySelector(".member-post-table").innerText.includes("Parish assembly") && document.querySelector(".member-post-table").innerText.includes("Youth formation")'));
 assert.ok(await evaluate('document.querySelector(".member-post-table").innerText.includes("Office closes at noon.")'));
 await evaluate('document.querySelector(".announcement-photos__grid button").click()');await pause(100);
 assert.ok(await evaluate('!!document.querySelector(".announcement-photo-viewer[open]")'));
 await evaluate('document.querySelector(".announcement-photo-viewer__header button").click()');
 for(const width of [1440,768,390,320]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<900});await pause(100);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
  if(width===1440||width===390)await screenshot('announcement-table-'+width);
  await evaluate('document.getElementById("member-post-tab-bulletin").click()');await pause(100);
  assert.ok(await evaluate('document.querySelector(".member-post-table").innerText.includes("Community project update")'));
  assert.equal(await evaluate('document.getElementById("member-post-tab-bulletin").getAttribute("aria-selected")'),'true');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
  if(width===1440||width===390)await screenshot('bulletin-table-'+width);
  await evaluate('document.getElementById("member-post-tab-announcement").click()');
 }
 await evaluate('document.getElementById("member-post-tab-bulletin").focus()');
 await command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});await pause(100);
 assert.equal(await evaluate('document.getElementById("member-post-tab-announcement").getAttribute("aria-selected")'),'true');
 await evaluate('window.failAnnouncements=true;document.querySelector(".member-post-board__header button").click()');await pause(200);
 assert.ok(await evaluate('document.querySelector("[role=alert]").textContent.includes("Could not load announcements")'));
 await evaluate('document.getElementById("member-post-tab-bulletin").click()');await pause(100);
 assert.ok(await evaluate('document.querySelector(".member-post-table").innerText.includes("Community project update")'));
 await evaluate('window.failAnnouncements=false;window.emptyPosts=true;document.querySelector(".member-post-board__header button").click()');await pause(200);
 assert.ok(await evaluate('!!document.querySelector(".client-empty-state .dashboard-empty-icon")'));
 assert.ok(await evaluate('window.postQueries.every(url=>/status=(ilike|eq)\\.Published/.test(url))'));
 assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
 console.log('Passed: announcement activity rows, legacy notices, tabs, bulletin table, photo viewer, keyboard switching, empty/error states, published queries, four responsive widths.');
}finally{close();}
