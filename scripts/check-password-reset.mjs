import assert from 'node:assert/strict';
import {command,evaluate,close} from './design-browser.mjs';
await command('Page.enable');
const {identifier}=await command('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
 sessionStorage.clear();window.resetCalls=[];window.resetFailure='';
 const original=window.fetch.bind(window);
 window.fetch=async(input,init={})=>{
 const url=String(input);if(!url.includes('supabase.co'))return original(input,init);
 const body=JSON.parse(init.body||'{}');window.resetCalls.push({url,body,headers:init.headers});
 if(url.endsWith('/recover'))return new Response(JSON.stringify(window.resetFailure==='send'?{msg:'Email service unavailable'}:{}),{status:window.resetFailure==='send'?500:200});
 if(url.endsWith('/verify'))return new Response(JSON.stringify(body.token==='123456'?{access_token:'verified-recovery-token'}:{msg:'Invalid token'}),{status:body.token==='123456'?200:403});
 if(url.endsWith('/user')&&init.method==='PUT')return new Response(JSON.stringify(window.resetFailure==='update'?{msg:'Password does not meet policy'}:{}),{status:window.resetFailure==='update'?422:200});
 return new Response('[]',{status:200});
 };
})()`});
const pause=()=>new Promise(r=>setTimeout(r,180));
const submit=()=>evaluate(`document.querySelector('.parishlink-recovery-form').requestSubmit()`);
try{
 await command('Page.navigate',{url:'http://127.0.0.1:5181/dist/index.html?resetTest=1#login'});
 await new Promise(r=>setTimeout(r,1200));await command('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,1400));
 await evaluate(`document.querySelector('.forgot-password-link').click();document.querySelector('.parishlink-recovery-form').elements.email.value='person@example.test';window.resetFailure='send'`);
 await submit();await pause();
 assert.equal(await evaluate(`document.querySelector('.parishlink-recovery-form').dataset.mode`),'request');
 await evaluate(`window.resetFailure=''`);await submit();await pause();
 assert.equal(await evaluate(`document.querySelector('.parishlink-recovery-form').dataset.mode`),'verify');
 await evaluate(`const f=document.querySelector('.parishlink-recovery-form');f.elements.code.value='999999';f.elements.password.value='New-password-123!';f.elements.confirm.value='New-password-123!';document.querySelector('#user-login-identifier').value='other@example.test'`);
 await submit();await pause();
 assert.equal(await evaluate(`window.resetCalls.filter(c=>c.url.endsWith('/user')).length`),0);
 await evaluate(`document.querySelector('.parishlink-recovery-form').elements.code.value='123456';window.resetFailure='update'`);
 await submit();await pause();
 assert.equal(await evaluate(`document.querySelector('.parishlink-recovery-form').dataset.mode`),'update');
 assert.ok(await evaluate(`document.querySelector('.parishlink-recovery-status').textContent.includes('policy')`));
 await evaluate(`window.resetFailure=''`);await submit();await pause();
 assert.equal(await evaluate(`document.querySelector('.parishlink-recovery-form').dataset.mode`),'complete');
 const calls=await evaluate('window.resetCalls');
 assert.equal(calls.some(c=>c.url.endsWith('/otp')),false);
 const verifies=calls.filter(c=>c.url.endsWith('/verify'));
 assert.equal(verifies.length,2);
 assert.ok(verifies.every(c=>c.body.type==='recovery'&&c.body.email==='person@example.test'));
 assert.ok(calls.filter(c=>c.url.endsWith('/user')).every(c=>c.headers.Authorization==='Bearer verified-recovery-token'));
 console.log('PASS recovery endpoint, email binding, invalid token rejection, password update retry without reusing OTP, success state, no magic-link request');
}finally{await command('Page.removeScriptToEvaluateOnNewDocument',{identifier});close();}

