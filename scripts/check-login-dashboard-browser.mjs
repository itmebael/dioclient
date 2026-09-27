import assert from 'node:assert/strict';
const tab = await (await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();
if (!tab) throw Error('No test tab');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0; const pending = new Map();
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m.result);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')console.log('ERROR',m.params.exceptionDetails.exception?.description);});
const call=(method,params={})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Browser command timed out: '+method)),10000);pending.set(++id,result=>{clearTimeout(timer);resolve(result);});ws.send(JSON.stringify({id,method,params}));});
try {
await call('Runtime.enable'); await call('Page.enable');
await call('Page.navigate',{url:'http://127.0.0.1:5190/dist/index.html#login'});
await new Promise(r=>setTimeout(r,1000));
await call('Runtime.evaluate',{expression:`(() => {
 const original = window.fetch.bind(window);
 const user = { id:'00000000-0000-4000-8000-000000000099', email:'login-check@example.test', user_metadata:{role:'user',display_name:'Login Check'} };
 const exp = Math.floor(Date.now()/1000)+3600;
 const token = btoa('{}')+'.'+btoa(JSON.stringify({sub:user.id,exp})) + '.test';
 window.fetch = async (input,init) => {
  const url = String(input.url || input);
  if(!url.includes('supabase.co')) return original(input,init);
  const data = url.includes('/auth/v1/token') ? {user,access_token:token,refresh_token:'test-refresh',expires_at:exp} : url.includes('/auth/v1/user') ? user : [];
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const set = (id,value) => {const el=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
 set('user-login-identifier',user.email);set('user-login-password','test-only-password');
 document.querySelector('input[type=checkbox]').click();
})()`});
await new Promise(r=>setTimeout(r,100));
await call('Runtime.evaluate',{expression:`document.querySelector('.login-submit').click()`});
await new Promise(r=>setTimeout(r,2000));
const result = await call('Runtime.evaluate',{expression:'({dashboard:!!document.querySelector(".user-home-dashboard"),shortcuts:document.querySelectorAll(".dashboard-extra-actions").length,samples:document.querySelectorAll("[class*=dashboard-sample-]").length,route:location.hash})',returnByValue:true});
console.log(result.result.value);
if (!result.result.value.dashboard) console.log(await call('Runtime.evaluate',{expression:'document.body.innerText',returnByValue:true}));
assert.deepEqual(result.result.value,{dashboard:true,shortcuts:1,samples:0,route:'#user-dashboard'});
await call('Runtime.evaluate',{expression:`location.hash='user-my-requests'`});
await new Promise(r=>setTimeout(r,500));
await call('Runtime.evaluate',{expression:`location.hash='user-dashboard'`});
await new Promise(r=>setTimeout(r,1000));
const returned = await call('Runtime.evaluate',{expression:'document.querySelectorAll(".dashboard-extra-actions").length',returnByValue:true});
assert.equal(returned.result.value,1);
console.log('Passed: password login reaches the live dashboard, remains responsive, and renders one shortcut group after navigation. Authentication responses were mocked.');
} finally {
 ws.close();
 await fetch('http://127.0.0.1:9223/json/close/'+tab.id);
}
