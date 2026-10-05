import assert from 'node:assert/strict';
const tab = await (await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();
if (!tab) throw Error('No test tab');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0; const pending = new Map();
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m.result);pending.delete(m.id);}if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')console.log('CONSOLE',m.params.args.map(a=>a.value||a.description));if(m.method==='Runtime.exceptionThrown')console.log('ERROR',m.params.exceptionDetails.exception?.description);});
const call=(method,params={})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Browser command timed out: '+method)),10000);pending.set(++id,result=>{clearTimeout(timer);resolve(result);});ws.send(JSON.stringify({id,method,params}));});
try {
await call('Runtime.enable'); await call('Page.enable');
await call('Page.navigate',{url:(process.env.CERTIFICATE_TEST_ORIGIN||'http://127.0.0.1:5190')+'/dist/index.html#login'});
await new Promise(r=>setTimeout(r,1000));
await call('Runtime.evaluate',{expression:`(() => {
 const original = window.fetch.bind(window);
 const user = { id:'00000000-0000-4000-8000-000000000099', email:'login-check@example.test', user_metadata:{role:'user',display_name:'Login Check'} };
 const exp = Math.floor(Date.now()/1000)+3600;
 const token = btoa('{}')+'.'+btoa(JSON.stringify({sub:user.id,exp})) + '.test';
 window.fetch = async (input,init) => {
  const url = String(input.url || input);
  if(!url.includes('supabase.co')) return original(input,init);
  if(url.includes('/diocese_service_bookings') && init?.method==='POST') window.certificateSavedPayload=JSON.parse(init.body);
  const data = url.includes('/auth/v1/token') ? {user,access_token:token,refresh_token:'test-refresh',expires_at:exp} : url.includes('/auth/v1/user') ? user : url.includes('/registered_users') ? [{id:user.id,full_name:'Signup Test Name',birthdate:${process.env.CERTIFICATE_TEST_EMPTY_PROFILE ? 'null' : "'1991-01-01'"},gender:${process.env.CERTIFICATE_TEST_EMPTY_PROFILE ? 'null' : "'Female'"},address:${process.env.CERTIFICATE_TEST_EMPTY_PROFILE ? 'null' : "'Signup Address'"},email:user.email,parish_name:'St. Peter & Paul Parish'}] : url.includes('/diocese_services') ? [{id:"test-certificate",name:"Baptismal Certificate",service_type:"certificate",fee:"PHP 100",status:"Available",parish_name:"St. Peter & Paul Parish"}] : [];
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const set = (id,value) => {const el=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
 set('user-login-identifier',user.email);set('user-login-password','test-only-password');
 document.querySelector('input[type=checkbox]').click();
})()`});
await new Promise(r=>setTimeout(r,100));
await call('Runtime.evaluate',{expression:`document.querySelector('.login-submit').click()`});
await new Promise(r=>setTimeout(r,2000));
await call('Runtime.evaluate',{expression:"location.hash='user-certificate'"});
await new Promise(r=>setTimeout(r,900));
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description);
  return result.result.value;
};
assert.equal(await evaluate(`document.querySelector('[name=requesterName]').value`),'Signup Test Name');
assert.equal(await evaluate(`document.querySelector('[name=requesterBirthday]').value`),process.env.CERTIFICATE_TEST_EMPTY_PROFILE?'':'1991-01-01');
assert.equal(await evaluate(`document.querySelector('[name=requesterGender]').value`),process.env.CERTIFICATE_TEST_EMPTY_PROFILE?'':'Female');
assert.equal(await evaluate(`document.querySelector('[name=requesterAddress]').value`),process.env.CERTIFICATE_TEST_EMPTY_PROFILE?'':'Signup Address');
assert.equal(await evaluate(`document.querySelector('[name=requesterAge]').value`),process.env.CERTIFICATE_TEST_EMPTY_PROFILE?'':String(new Date().getFullYear()-1991));
assert.deepEqual(await evaluate(`(() => {
 const form = document.querySelector('[data-certificate-step]');
 return [...form.querySelectorAll('input,select')].filter(el=>el.getClientRects().length).map(el=>el.name);
})()`), ['requesterName','requesterAge','requesterGender','requesterBirthday','requesterAddress','requesterRelationship']);
await evaluate(`document.querySelector('[name=requesterRelationship]').value='';document.querySelector('.certificate-booking-modal__actions .primary-action').click()`);
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'1');
await evaluate(`(() => {
 for (const [name,value] of Object.entries({requesterName:'Maria Santos',requesterAge:'35',requesterGender:'Female',requesterBirthday:'1991-01-01',requesterAddress:'Calbayog',requesterRelationship:'Parent'})) document.querySelector('[name="'+name+'"]').value=value;
 document.querySelector('.certificate-booking-modal__actions .primary-action').click();
})()`);
await new Promise(r=>setTimeout(r,150));
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'2');
await evaluate(`(() => {
 for (const [name,value] of Object.entries({parishName:'St. Peter & Paul Parish',clientFirstName:'Juan',clientMiddleName:'Reyes',clientLastName:'Santos',motherName:'Maria',motherLastName:'Santos',fatherName:'Jose',fatherLastName:'Santos',bookingDate:new Date().toISOString().slice(0,10)})) document.querySelector('[name="'+name+'"]').value=value;
 const parish=document.querySelector('.dio-parish-dd select');if(parish&&parish.options.length>1){parish.selectedIndex=1;parish.dispatchEvent(new Event('change',{bubbles:true}));}
 document.querySelector('.certificate-booking-modal__actions .primary-action').click();
})()`);
await new Promise(r=>setTimeout(r,150));
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'3');
await evaluate(`document.querySelector('.certificate-booking-modal__actions .primary-action').click()`);
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'3');
await evaluate(`(() => {const method=document.querySelector('[data-pay-method]');method.value='gcash';method.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('.certificate-booking-modal__actions .primary-action').click()})()`);
await new Promise(r=>setTimeout(r,150));
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'4');
const review=await evaluate(`document.querySelector('.certificate-review').innerText`);
assert.ok(review.includes('Maria Santos') && review.includes('Parent') && review.includes('GCash') && review.includes('PHP 100'));
await evaluate(`document.querySelector('.certificate-booking-modal__actions .secondary-action').click()`);
await new Promise(r=>setTimeout(r,150));
assert.equal(await evaluate(`document.querySelector('[data-pay-method]').value`),'gcash');
await evaluate(`document.querySelector('.certificate-booking-modal__actions .primary-action').click()`);
await new Promise(r=>setTimeout(r,150));
await evaluate(`document.querySelector('.certificate-booking-modal__actions button[type=submit]').click()`);
await new Promise(r=>setTimeout(r,500));
const saved=await evaluate('window.certificateSavedPayload');
const payload=Array.isArray(saved)?saved[0]:saved;
assert.equal(payload.requester_relationship,'Parent');
assert.equal(payload.payment_amount,100);
assert.equal(payload.payment_fee,0);
assert.equal(payload.payment_total,100);
await evaluate("location.hash='user-dashboard'");
await new Promise(r=>setTimeout(r,300));
await evaluate("location.hash='user-certificate'");
await new Promise(r=>setTimeout(r,500));
assert.equal(await evaluate(`document.querySelector('[data-certificate-step]').dataset.certificateStep`),'1');
assert.equal(await evaluate(`document.querySelector('[name=requesterName]').value`),'Signup Test Name');
console.log('Passed: certificate page navigation, saved relationship and PHP 100 pricing, four stages, required fields, required payment, review details, and Back preserves entries. Database responses were mocked.');
} finally {
 ws.close();
 await fetch('http://127.0.0.1:9223/json/close/'+tab.id);
}
