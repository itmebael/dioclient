import fs from 'node:fs';
let source = fs.readFileSync('scripts/check-login-dashboard-browser.mjs','utf8');
source = "import fs from 'node:fs';\n" + source.replace('} finally {', `
await call('Runtime.evaluate',{expression:"location.hash='user-services'"});
await new Promise(r=>setTimeout(r,900));
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
assert.equal(await evaluate('!!document.querySelector(".schedules-bookings")'),true);
assert.equal(await evaluate('document.querySelectorAll(".schedule-filters button").length'),3);
await evaluate('document.querySelector(".user-appointment-day.is-available:not(.is-selected)").click()');
assert.equal(await evaluate('document.querySelector(".user-appointment-form input[type=date]").value.length'),10);
await evaluate('document.querySelectorAll(".schedule-filters button")[1].click()');
assert.equal(await evaluate('document.querySelectorAll(".schedule-filters button")[1].getAttribute("aria-pressed")'),'true');
for (const width of [1440,768,390,320]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<701});
 await new Promise(r=>setTimeout(r,200));
 console.log('Appointment layout',width,await evaluate('({overflow:document.documentElement.scrollWidth>innerWidth,form:document.querySelector(".user-appointment-form").getBoundingClientRect().width})'));
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('(()=>{const e=document.querySelector(".user-appointment-calendar");return e.scrollWidth>e.clientWidth+1})()'),false,'Calendar must fit without horizontal scrolling');
}
await evaluate('(()=>{const e=document.querySelector(".booking-kind select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(e,"certificate");e.dispatchEvent(new Event("change",{bubbles:true}));})()');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".user-appointment-form")).display'),'none');
assert.equal(await evaluate('!!document.querySelector("#selectedCertificateService")'),true);
assert.equal(await evaluate('document.querySelector("[name=bookingDate]").value===document.querySelector("[name=appointmentDate]").value'),true);
for(const width of [1440,390,320]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<701});
 await new Promise(r=>setTimeout(r,200));
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 await evaluate('document.querySelector(".schedules-request-panel").scrollIntoView()');
 assert.equal(await evaluate('!!document.querySelector(".certificate-inline form")'),true);
 assert.equal(await evaluate('!!document.querySelector(".certificate-booking-modal[role=dialog]")'),false);
 if(width!==320) fs.writeFileSync('.design-preview/schedules-'+width+'.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
}
await evaluate("location.hash='user-appointments'");await new Promise(r=>setTimeout(r,300));
assert.equal(await evaluate('getComputedStyle(document.querySelector(".user-appointment-form")).display'),'grid');
await evaluate("location.hash='user-certificate'");await new Promise(r=>setTimeout(r,300));
assert.equal(await evaluate('!!document.querySelector("#selectedCertificateService")'),true);
await evaluate(\`(() => {
 window.bookingTestWrites=[];
 const original=window.fetch;
 window.fetch=async(input,init={})=>{
  const url=String(input.url||input);
  if(url.includes('/rest/v1/diocese_service_bookings')&&init.method==='POST') {
   window.bookingTestWrites.push(JSON.parse(init.body));
   return new Response(JSON.stringify([{id:'test-booking'}]),{status:201,headers:{'Content-Type':'application/json'}});
  }
  return original(input,init);
 };
})()\`);
await evaluate(\`(() => {
 const form=document.querySelector('.certificate-booking-modal__dialog');
 for(const input of form.querySelectorAll('input:not([readonly])')) {
  if(input.type==='date') { if(!input.value) input.value='1996-01-01'; }
  else if(input.type==='number') input.value='30';
  else input.value='Test Request';
  input.dispatchEvent(new Event('input',{bubbles:true}));
 }
 for(const select of form.querySelectorAll('select')) {
  if(!select.value) select.value=[...select.options].find(o=>o.value)?.value||'';
  select.dispatchEvent(new Event('change',{bubbles:true}));
 }
 form.requestSubmit();
})()\`);
await new Promise(r=>setTimeout(r,400));
assert.equal(await evaluate('window.bookingTestWrites.length'),1,'Certificate submission reaches existing booking API');
assert.equal(await evaluate('window.bookingTestWrites[0].reference_number.startsWith("CERT-")'),true);
await evaluate("location.hash='user-appointments'");await new Promise(r=>setTimeout(r,500));
await evaluate(\`(() => {
 const form=document.querySelector('.user-appointment-form');
 form.elements.appointmentName.value='Test Appointment';
 form.elements.appointmentFatherName.value='Test Guardian';
 form.requestSubmit();
})()\`);
await new Promise(r=>setTimeout(r,400));
assert.equal(await evaluate('window.bookingTestWrites.length'),2,'Appointment submission reaches existing booking API');
assert.equal(await evaluate('window.bookingTestWrites[1].reference_number.startsWith("APT-")'),true);
console.log('Passed: unified routes, date selection, filters, certificate date transfer, form switching, and responsive widths.');
} finally {`);
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
