import fs from 'node:fs';
const heartbeat=`
N.useEffect(()=>{
  const token=be(d);
  if(d?.role!=="parish"||!token)return;
  const beat=()=>{if(document.visibilityState==="visible")Tt("/rest/v1/rpc/heartbeat_parish_presence",{method:"POST",body:{},accessToken:token}).catch(()=>{})};
  beat();const timer=window.setInterval(beat,30000);
  document.addEventListener("visibilitychange",beat);
  return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",beat)};
},[d?.role,d?.accessToken]);
`;
const status=`
const [parishActive,setParishActive]=N.useState(null);
N.useEffect(()=>{
  setParishActive(null);
  if(!f?.id||!c)return;
  let cancelled=false;
  async function check(){try{
    const active=await Tt("/rest/v1/rpc/get_parish_presence",{method:"POST",body:{p_parish_id:f.id},accessToken:c});
    if(!cancelled)setParishActive(typeof active==="boolean"?active:null);
  }catch{if(!cancelled)setParishActive(null)}}
  check();const timer=window.setInterval(check,15000);
  return()=>{cancelled=true;window.clearInterval(timer)};
},[c,f?.id]);
`;
const badge=',n.jsx("span",{className:"parish-presence "+(parishActive===true?"is-active":parishActive===false?"is-inactive":"is-unknown"),role:"status",children:parishActive===true?"Parish Active":parishActive===false?"Parish Inactive":"Status unavailable"})';
for(const name of ['index-login-20261004-clean-registration.js','index-login-20261004.js','index-v20260422157000.js']) {
  const file='dist/assets/'+name;
  let source=fs.readFileSync(file,'utf8');
  const hook='const sessionReady=useSessionAccess(N,d,v,gh,ln);';
  if(!source.includes(hook))throw Error('Missing session hook');
  source=source.replace(hook,hook+heartbeat);
  const start=source.indexOf('function Ag(');
  const end=source.indexOf('function ',source.indexOf('const L=io(',start));
  let chat=source.slice(start,end);
  chat=chat.replace('const aiReplies=',status+'const aiReplies=');
  const header='children:(f==null?void 0:f.parish_name)||o||"Link your parish to start a conversation"})]})]})';
  if(!chat.includes(header))throw Error('Missing chat header');
  chat=chat.replace(header,'children:(f==null?void 0:f.parish_name)||o||"Link your parish to start a conversation"})]})'+badge+']})');
  source=source.slice(0,start)+chat+source.slice(end);
  fs.writeFileSync(file,source);
}
const file='dist/index.html';
fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('v=20261005-support-header-6','v=20261005-parish-presence-7'));
