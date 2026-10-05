import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('dist/assets/index-login-20261004-clean-registration.js','utf8');
const start=source.indexOf('const aiReplies=');
const logic=source.slice(start,source.indexOf('N.useEffect(()=>{m.current',start));
assert(!source.includes('Parish Office Details'));
const user={id:'user-1',sender_role:'user',message_text:'How do I request a certificate?',created_at:new Date().toISOString()};
async function run({latest=[user],confirm=latest,failAi=false,cancel=false}={}) {
  let timer,delay,cleanup,aiCalls=0,rows=[user],reads=0;
  const context={N:{useRef:value=>({current:value}),useState:()=>[false,()=>{}],useEffect:fn=>{cleanup=fn()}},
    window:{setTimeout:(fn,ms)=>{timer=fn;delay=ms;return 1},clearInterval(){},clearTimeout:()=>{}},
    c:'token',a:'member',f:{id:'parish'},v:rows,A:false,x:null,e:{},s:{},i:'Member',
    qf:async()=>++reads===1?latest:confirm,Hf:async()=>{aiCalls++;if(failAi)throw Error('offline');return 'AI answer'},
    Vf:()=> 'Fallback answer',w:fn=>{rows=fn(rows)},Date,Set};
  vm.runInNewContext(logic,context);
  assert(delay>29000&&delay<=30000);
  if(cancel)cleanup();
  await timer();
  return {rows,aiCalls};
}
assert.equal((await run()).rows.at(-1).sender_name,'Dio AI Support');
assert.equal((await run({failAi:true})).rows.at(-1).message_text,'Fallback answer');
const parish={id:'parish-1',sender_role:'parish'};
assert.equal((await run({latest:[user,parish]})).aiCalls,0);
assert.equal((await run({confirm:[user,parish]})).rows.length,1);
assert.equal((await run({cancel:true})).aiCalls,0);
console.log('Verified 30-second delay, AI reply, fallback, parish reply cancellation, and unmount cancellation.');
