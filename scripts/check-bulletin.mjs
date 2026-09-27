import fs from 'node:fs';
let source = fs.readFileSync('scripts/check-login-dashboard-browser.mjs', 'utf8');
source = source.replace('} finally {', `
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
assert.equal(await evaluate('[...document.querySelectorAll(".nav-item")].some(e=>e.textContent.trim()==="Bulletin")'),true);
await evaluate('[...document.querySelectorAll(".nav-item")].find(e=>e.textContent.trim()==="Bulletin").click()');
await new Promise(r=>setTimeout(r,700));
assert.equal(await evaluate('location.hash'),'#user-bulletin');
assert.equal(await evaluate('document.querySelectorAll(".bulletin-post").length'),5);
assert.equal(await evaluate('document.querySelector(".bulletin-notice").textContent.includes("not actual parish posts")'),true);
await evaluate('document.querySelector(".bulletin-notice button").click()');
await new Promise(r=>setTimeout(r,100));
assert.equal(await evaluate('document.querySelectorAll(".bulletin-post").length'),0);
await evaluate(\`(() => {
 const original=window.fetch;
 window.bulletinRequests=[];
 window.fetch=async(input,init={})=>{
  const url=String(input.url||input);
  if(url.includes('/rest/v1/parish_bulletins?')) {
   window.bulletinRequests.push({url,method:init.method||'GET'});
   return new Response(JSON.stringify([{id:'published-post',title:'Parish project progress',content:'Published parish report\\nSecond paragraph',category:'Project transparency',published_at:'2026-09-27T08:00:00Z',parishes:{parish_name:'Test Parish'}}]),{status:200,headers:{'Content-Type':'application/json'}});
  }
  return original(input,init);
 };
})()\`);
await evaluate('document.querySelector(".bulletin-intro button").click()');
await new Promise(r=>setTimeout(r,400));
assert.equal(await evaluate('document.querySelectorAll(".bulletin-post").length'),1);
assert.equal(await evaluate('document.querySelector(".bulletin-author").textContent'),'Posted by Test Parish');
assert.equal(await evaluate('!!document.querySelector(".bulletin-post-meta strong")'),false);
assert.equal(await evaluate('window.bulletinRequests.every(r=>r.method==="GET" && r.url.includes("status=eq.Published"))'),true);
await evaluate('(()=>{const select=document.querySelector(".bulletin-filter select");select.value="Fundraising";select.dispatchEvent(new Event("change",{bubbles:true}));})()');
await new Promise(r=>setTimeout(r,100));
assert.equal(await evaluate('document.querySelectorAll(".bulletin-post").length'),0);
await evaluate('(()=>{const select=document.querySelector(".bulletin-filter select");select.value="All updates";select.dispatchEvent(new Event("change",{bubbles:true}));})()');
for(const width of [1440,390,320]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<701});
 await new Promise(r=>setTimeout(r,100));
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
}
await evaluate('location.hash="user-dashboard"');
await new Promise(r=>setTimeout(r,500));
await evaluate('[...document.querySelectorAll(".dashboard-shortcut")].find(e=>e.querySelector("strong")?.textContent==="Bulletin").click()');
await new Promise(r=>setTimeout(r,400));
assert.equal(await evaluate('!!document.querySelector(".parish-bulletin")'),true);
console.log('Passed: Bulletin sidebar, labeled samples, parish attribution, published-post query, filters, dashboard shortcut, and responsive layouts. Database responses mocked.');
} finally {`);
try { await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')); }
catch (error) { console.error(error.message); process.exitCode=1; }
