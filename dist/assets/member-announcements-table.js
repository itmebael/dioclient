import { parseAnnouncementActivities } from './announcement-activities.js';
import {AnnouncementPhotos,FeedPostHeader} from './announcement-reports.js?v=20261008-social-feed';
const categories=['Project transparency','Donations & contributions','Visiting priests','Fundraising','Parish matters'];
export function activityRows(post){ return parseAnnouncementActivities(post); }
function dateLabel(value){if(!value)return '—';const date=new Date(value.length===10?value+'T00:00:00':value);return Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
export function MemberAnnouncements({React:R,readPosts,accessToken,EmptyState}){
 const h=R.createElement;
 const [tab,setTab]=R.useState('announcement'),[category,setCategory]=R.useState('All updates');
 const [data,setData]=R.useState({announcement:[],bulletin:[]}),[errors,setErrors]=R.useState({}),[loading,setLoading]=R.useState(true),[revision,setRevision]=R.useState(0);
 R.useEffect(()=>{
  let active=true;setLoading(true);setErrors({});
  const queries=[['announcement','diocese_announcements','select=*&status=ilike.Published&order=created_at.desc,id.desc'],['bulletin','parish_bulletins','select=*,parishes(parish_name)&status=eq.Published&order=published_at.desc,id.desc']];
  Promise.allSettled(queries.map(async ([,table,query])=>{
   const rows=[];for(let offset=0;;offset+=100){const batch=await readPosts(table,query+'&limit=100&offset='+offset,accessToken);if(!Array.isArray(batch))throw new Error('Unexpected parish posts response.');rows.push(...batch);if(batch.length<100)break;if(!active)return [];}
   return rows;
  })).then(results=>{
   if(!active)return;const next={},failures={};
   results.forEach((result,index)=>{const kind=queries[index][0];next[kind]=result.status==='fulfilled' && Array.isArray(result.value)?result.value:[];if(result.status==='rejected')failures[kind]='Could not load '+(kind==='announcement'?'announcements':'bulletins')+'. '+(result.reason?.message||'Please try again.');});
   setData(next);setErrors(failures);setLoading(false);
  });return()=>{active=false};
 },[readPosts,accessToken,revision]);
 R.useEffect(()=>{const refresh=()=>setRevision(value=>value+1);window.addEventListener('focus',refresh);const timer=setInterval(()=>{if(!document.hidden)refresh();},30000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer);};},[]);
 const announcements=data.announcement;
 const bulletins=data.bulletin.filter(post=>category==='All updates'||post.category===category);
 const rows=tab==='announcement'?announcements:bulletins;
 const switchTab=next=>{setTab(next);document.getElementById('member-post-tab-'+next)?.focus();};

 const empty=h(EmptyState,{title:tab==='announcement'?'No announcements yet':'No published bulletins',message:'Published updates from your parish will appear here.'});
 return h('section',{className:'member-announcements-table parish-social-feed'},
  h('div',{className:'member-post-tabs',role:'tablist','aria-label':'Parish posts'},[['announcement','Announcements'],['bulletin','Bulletin']].map(([kind,label])=>h('button',{key:kind,id:'member-post-tab-'+kind,type:'button',role:'tab','aria-selected':tab===kind,'aria-controls':'member-post-panel',tabIndex:tab===kind?0:-1,onClick:()=>setTab(kind),onKeyDown:event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();switchTab(event.key==='Home'?'announcement':event.key==='End'?'bulletin':kind==='announcement'?'bulletin':'announcement');}}},label))),
  h('div',{id:'member-post-panel',role:'tabpanel','aria-labelledby':'member-post-tab-'+tab,className:'social-feed-panel'},
   h('header',{className:'social-feed-toolbar'},h('div',null,h('h4',null,tab==='announcement'?'Latest announcements':'Parish bulletin'),h('p',null,'Updates from your parish community.')),h('button',{type:'button',disabled:loading,onClick:()=>setRevision(value=>value+1)},loading?'Refreshing...':'Refresh')),
   tab==='bulletin'?h('label',{className:'member-bulletin-filter'},h('span',null,'Category'),h('select',{value:category,onChange:event=>setCategory(event.target.value)},['All updates',...categories].map(value=>h('option',{key:value,value},value)))):null,
   loading?h('p',{role:'status',className:'social-feed-status'},'Loading parish posts...'):errors[tab]?h('p',{role:'alert',className:'member-post-error'},errors[tab]):rows.length?h('div',{className:'social-post-list'},rows.map(post=>h('article',{key:post.id||post.title,className:'social-post'},
    h(FeedPostHeader,{React:R,name:post.parishes?.parish_name||post.parish_name||'Parish Office',date:post.published_at||post.created_at,category:tab==='announcement'?'Parish announcement':post.category||'Parish bulletin'}),
    tab==='announcement'?h('div',{className:'social-post-activities'},activityRows(post).map((item,index)=>h('section',{key:index,className:'social-post-activity'},h('div',{className:'social-activity-heading'},h('span',null,'Activity date'),h('time',{dateTime:item.date},dateLabel(item.date))),h('div',{className:'social-activity-description'},h('span',null,'Activity'),h('p',null,item.activity)),item.barangay||item.organization?h('dl',{className:'social-activity-location'},item.barangay?h('div',null,h('dt',null,'Barangay'),h('dd',null,item.barangay)):null,item.organization?h('div',null,h('dt',null,'Organization'),h('dd',null,item.organization)):null):null))):h('div',{className:'social-post-copy'},h('h3',null,post.title),h('p',null,post.content||'')),
    h(AnnouncementPhotos,{React:R,row:post}),
    h('footer',{className:'social-post-footer'},h('span',null,'Posted by your parish office'),post.audience?.startsWith('BEC Area:')?h('span',null,post.audience):null)
   ))):empty));
}
