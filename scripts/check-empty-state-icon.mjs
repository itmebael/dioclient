import fs from 'node:fs';
import assert from 'node:assert/strict';
import {command,evaluate,screenshot,close} from './admin-match-browser.mjs';
try {
 await command('Page.enable');
 const source=fs.readFileSync('scripts/check-heaven-design.mjs','utf8').split('const fixtures = `')[1].split('`;')[0];
 const fixture=source.split('\n').filter(line=>!line.includes("if(url.includes('/parish_events?")&&!line.includes("if(url.includes('/diocese_service_bookings?")).join('\n');
 await command('Page.addScriptToEvaluateOnNewDocument',{source:'(()=>{'+fixture+'})()'});
 await command('Page.navigate',{url:'http://127.0.0.1:5181/dist/index.html?previewRole=user#user-dashboard'});
 await new Promise(r=>setTimeout(r,1800));
 assert.ok(await evaluate(`!!document.querySelector('.user-home-card--mass .empty-state .dashboard-empty-icon')`));
 assert.ok(await evaluate(`document.querySelector('.user-home-card--mass .empty-state').innerText.includes('No upcoming mass')`));
 await screenshot('client-empty-states');
 console.log('No upcoming Mass state displays the admin tray icon.');
}finally{close();}
