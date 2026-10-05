import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('dist/assets/index-login-20261004-clean-registration.js','utf8');
const start=source.indexOf('const [parishActive');
const status=source.slice(start,source.indexOf('const aiReplies=',start));
for(const expected of [true,false,null]) {
  let value='unset',cleanup,interval;
  vm.runInNewContext(status,{
    N:{useState:()=>[null,next=>{value=next}],useEffect:fn=>{cleanup=fn()}},
    f:{id:'parish'},c:'token',
    Tt:async()=>{if(expected===null)throw Error('unavailable');return expected},
    window:{setInterval:(_fn,ms)=>{interval=ms;return 1},clearInterval:()=>{}}
  });
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(value,expected);
  assert.equal(interval,15000);
  cleanup();
}
console.log('Verified active, inactive, and unavailable parish statuses and 15-second refresh.');
