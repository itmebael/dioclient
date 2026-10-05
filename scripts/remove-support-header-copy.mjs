import fs from 'node:fs';
const badge=',n.jsx(G,{tone:v.length>0?"green":"blue",children:aiBusy?"Dio AI is replying...":"Dio AI helps after 30 seconds without a parish reply"})';
for(const name of ['index-login-20261004-clean-registration.js','index-login-20261004.js','index-v20260422157000.js']) {
  const file='dist/assets/'+name;
  const source=fs.readFileSync(file,'utf8');
  if(!source.includes(badge))throw Error('Badge missing: '+name);
  fs.writeFileSync(file,source.replace(badge,''));
}
const file='dist/index.html';
fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('v=20261005-support-handoff-5','v=20261005-support-header-6').replace('v=20261005-handoff-20260929-chat-layout','v=20261005-support-header-6'));
