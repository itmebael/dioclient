import fs from 'node:fs';

const handoff = `
const aiReplies=N.useRef([]),aiHandled=N.useRef(new Set()),[aiBusy,setAiBusy]=N.useState(false);
N.useEffect(()=>{aiReplies.current=[];aiHandled.current.clear()},[c,a,f==null?void 0:f.id]);
N.useEffect(()=>{
  const last=v.filter(row=>row.sender_role!=="ai").at(-1);
  if(A||x||!last||last.sender_role!=="user"||!last.id||aiHandled.current.has(last.id))return;
  let cancelled=false;
  const timer=window.setTimeout(async()=>{
    setAiBusy(true);
    try{
      const latest=await qf({parishId:f.id,userEmail:a,accessToken:c});
      if(cancelled)return;
      const newest=(Array.isArray(latest)?latest:[]).at(-1);
      if(!newest||newest.id!==last.id||newest.sender_role!=="user")return;
      let answer;
      try{answer=await Hf({messages:v.map(row=>({role:row.sender_role==="user"?"user":"assistant",text:row.message_text})),userProfile:e,accessToken:c})}
      catch{answer=Vf(last.message_text,{parishName:s.parish_name,accountName:i})}
      if(cancelled)return;
      const confirmed=await qf({parishId:f.id,userEmail:a,accessToken:c});
      if(cancelled||(confirmed||[]).at(-1)?.id!==last.id)return;
      const reply={id:"ai-"+last.id,sender_role:"ai",sender_name:"Dio AI Support",message_text:answer,created_at:new Date().toISOString()};
      aiHandled.current.add(last.id);aiReplies.current.push(reply);w(rows=>[...rows,reply]);
    }catch{/* Leave the parish thread available if the connection fails. */}
    finally{if(!cancelled)setAiBusy(false)}
  },Math.max(0,30000-(Date.now()-new Date(last.created_at).getTime())));
  return()=>{cancelled=true;window.clearTimeout(timer);setAiBusy(false)};
},[v.filter(row=>row.sender_role!=="ai").at(-1)?.id,A,!!x,c,a,f?.id]);
`;

for (const name of ['index-login-20261004-clean-registration.js','index-login-20261004.js','index-v20260422157000.js']) {
  const file='dist/assets/'+name;
  let source=fs.readFileSync(file,'utf8');
  const start=source.indexOf('function Ag(');
  const end=source.indexOf('function ',source.indexOf('Parish Office Details',start));
  let chat=source.slice(start,end);
  const panel=chat.indexOf(',n.jsxs("article",{className:"user-panel user-support-side"');
  if(panel<0||!chat.trimEnd().endsWith(']})}'))throw new Error('Unexpected chat structure: '+name);
  chat=chat.slice(0,panel)+']})}\n';
  chat=chat.replace('N.useEffect(()=>{m.current',handoff+'N.useEffect(()=>{m.current');
  chat=chat.replace('w(Array.isArray(se)?se:[])','w([...(Array.isArray(se)?se:[]),...aiReplies.current].sort((left,right)=>new Date(left.created_at)-new Date(right.created_at)))');
  chat=chat.replace('children:jh(S,L)','children:S.sender_role==="ai"?"Dio AI Support":jh(S,L)');
  chat=chat.replace('children:"Chat with Parish Secretary"','children:"Send us a Message"');
  chat=chat.replace('children:f!=null&&f.contact_number?"Live parish desk":"Member thread"','children:aiBusy?"Dio AI is replying...":"Dio AI helps after 30 seconds without a parish reply"');
  source=source.slice(0,start)+chat+source.slice(end);
  fs.writeFileSync(file,source);
}
const html='dist/index.html';
fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('v=20261005-calbayog-branding-4','v=20261005-support-handoff-5').replace('support-bento.css?v=','support-bento.css?v=20261005-handoff-'));
