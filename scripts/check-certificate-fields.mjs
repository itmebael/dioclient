import fs from 'node:fs';
let source=fs.readFileSync('scripts/check-login-dashboard-browser.mjs','utf8');
const checks="const tabCount=await evaluate('document.querySelectorAll(\".certificate-tabs [role=tab]\").length');\nassert.equal(tabCount,6);\nfor(let index=0;index<tabCount;index++) {\n await evaluate('document.querySelectorAll(\".certificate-tabs [role=tab]\")['+index+'].click()');\n await new Promise(r=>setTimeout(r,100));\n assert.equal(await evaluate('(() => { const tab=document.querySelector(\".certificate-tabs [aria-selected=true]\"); const panel=document.getElementById(tab.getAttribute(\"aria-controls\")); return !!panel.querySelector(\"form\") && panel.getBoundingClientRect().height>0 && getComputedStyle(tab.parentElement).display!==\"none\"; })()'),true,'Each tab displays its form immediately');\n assert.equal(await evaluate('document.querySelectorAll(\".user-certificate-booking form\").length'),1,'Only the selected service form is mounted');\n if(index<5) assert.equal(await evaluate('document.querySelector(\"[name=bookingServiceName]\").value===document.querySelector(\".certificate-tabs [aria-selected=true]\").textContent'),true);\n else assert.equal(await evaluate('document.querySelector(\"#certificate-panel-correction\").textContent.includes(\"Incorrect Information\")'),true);\n}\nawait evaluate('document.querySelector(\".certificate-tabs [role=tab]\").click()');\nawait new Promise(r=>setTimeout(r,100));\n";
source=source.replace('} finally {',`
await call('Runtime.evaluate',{expression:"location.hash='user-certificate'"});
await new Promise(r=>setTimeout(r,900));
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
`+checks+`
for(let index=0;index<5;index++) {
 await evaluate('document.querySelectorAll(".certificate-tabs [role=tab]")['+index+'].click()');
 await new Promise(r=>setTimeout(r,100));
 const visible=await evaluate('(() => {const form=document.querySelector(".certificate-inline form"); const fields=[...form.querySelectorAll("input,select")]; return {count:fields.length,allVisible:fields.every(f=>f.getBoundingClientRect().height>0 && f.checkVisibility()),header:form.querySelector(".certificate-booking-modal__header").checkVisibility(),details:form.querySelector(".certificate-booking-modal__service").checkVisibility(),reference:!!form.elements.referenceNumber.value};})()');
 assert.equal(visible.count,15,'All certificate fields are present');
 assert.equal(visible.allVisible,true,'Every certificate field is visible');
 assert.equal(visible.header,true);
 assert.equal(visible.details,true);
 assert.equal(visible.reference,true);
}
await evaluate('document.querySelector(".certificate-tabs [role=tab]").click()');
assert.equal(await evaluate('document.querySelector("dialog.ucs-remind").open'),false);
await evaluate('document.querySelector(".ucs-remind-trigger").click()');
assert.equal(await evaluate('document.querySelector("dialog.ucs-remind").open'),true);
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await new Promise(r=>setTimeout(r,100));
assert.equal(await evaluate('document.querySelector("dialog.ucs-remind").open'),false);
assert.equal(await evaluate('document.activeElement.matches(".ucs-remind-trigger")'),true);
await evaluate('document.querySelector(".ucs-remind-trigger").click()');
await evaluate('document.querySelector(".ucs-remind__close").click()');
assert.equal(await evaluate('document.querySelector("dialog.ucs-remind").open'),false);
for(const width of [1440,390,320]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<701});
 await new Promise(r=>setTimeout(r,100));
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('(() => {const icon=document.querySelector(".ucs-remind-trigger svg");const r=icon.getBoundingClientRect();return icon.checkVisibility() && r.width>=24 && r.height>=24 && getComputedStyle(icon).stroke!==getComputedStyle(icon.parentElement).backgroundColor;})()'),true,'Note icon is visible and contrasts with its background');
 assert.equal(await evaluate('(() => {const sizes=[...document.querySelectorAll(".certificate-tabs button")].map(b=>b.getBoundingClientRect());return sizes.every(s=>Math.abs(s.width-sizes[0].width)<1 && s.height===sizes[0].height);})()'),true,'Tabs have equal dimensions');
 assert.equal(await evaluate('document.querySelector(".certificate-tabs").getBoundingClientRect().bottom<=document.querySelector(".user-certificate-booking__selector").getBoundingClientRect().top'),true,'Tabs appear above the selector');
 await evaluate('document.querySelector(".ucs-remind-trigger").click()');
 assert.equal(await evaluate('(() => {const r=document.querySelector("dialog.ucs-remind").getBoundingClientRect();return r.width>0 && r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;})()'),true,'Popup fits the viewport');
 await evaluate('document.querySelector(".ucs-remind__close").click()');
}
console.log('Passed: six tabs display their matching fields, only one form mounted, and desktop/mobile layouts fit.');
} finally {`);
try { await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')); }
catch(error) { console.error(error.message); process.exitCode=1; }
