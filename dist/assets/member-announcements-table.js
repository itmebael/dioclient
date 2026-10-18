import {AnnouncementPhotos,isFinancialReport} from './announcement-reports.js?v=20261008-social-feed';
const categories=['Project transparency','Donations & contributions','Visiting priests','Fundraising','Parish matters'];
export function activityRows(post){
 const lines=String(post.content||'').split('\n');
 if(lines.length && lines.every(line=>/^\d{4}-\d{2}-\d{2}\t.+$/.test(line)))return lines.map(line=>({date:line.slice(0,10),activity:line.slice(11)}));
 return [{date:String(post.published_at||post.created_at||'').slice(0,10),activity:[post.title,post.content].filter(Boolean).join(' — ')}];
}
function dateLabel(value){if(!value)return '—';const date=new Date(value.length===10?value+'T00:00:00':value);return Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
export function MemberAnnouncements({React:R,readPosts,accessToken,EmptyState}){
 const h=R.createElement;
 const [tab,setTab]=R.useState('announcement'),[category,setCategory]=R.useState('All updates');
 const [data,setData]=R.useState({announcement:[],bulletin:[]}),[errors,setErrors]=R.useState({}),[loading,setLoading]=R.useState(true),[revision,setRevision]=R.useState(0);
 R.useEffect(()=>{
  let active=true;setLoading(true);setErrors({});
  const queries=[['announcement','diocese_announcements','select=*&status=ilike.Published&order=created_at.desc&limit=100'],['bulletin','parish_bulletins','select=*,parishes(parish_name)&status=eq.Published&order=published_at.desc&limit=100']];
  Promise.allSettled(queries.map(([,table,query])=>readPosts(table,query,accessToken))).then(results=>{
   if(!active)return;const next={},failures={};
   results.forEach((result,index)=>{const kind=queries[index][0];next[kind]=result.status==='fulfilled' && Array.isArray(result.value)?result.value:[];if(result.status==='rejected')failures[kind]='Could not load '+(kind==='announcement'?'announcements':'bulletins')+'. '+(result.reason?.message||'Please try again.');});
   setData(next);setErrors(failures);setLoading(false);
  });return()=>{active=false};
 },[readPosts,accessToken,revision]);
 const announcements=data.announcement.filter(post=>!isFinancialReport(post));
 const bulletins=data.bulletin.filter(post=>category==='All updates'||post.category===category);
 const rows=tab==='announcement'?announcements:bulletins;
 const switchTab=next=>{setTab(next);document.getElementById('member-post-tab-'+next)?.focus();};
 const headers=tab==='announcement'?['Petsa','Aktibidades']:['Date','Title','Category','Details'];
 const empty=h(EmptyState,{title:tab==='announcement'?'No announcements yet':'No published bulletins',message:tab==='announcement'?'Published parish activities will appear here.':'Published bulletins in this category will appear here.'});
 return h('section',{className:'member-announcements-table'},
  h('div',{className:'member-post-tabs',role:'tablist','aria-label':'Parish posts'},[['announcement','Announcements'],['bulletin','Bulletin']].map(([kind,label])=>h('button',{key:kind,id:'member-post-tab-'+kind,type:'button',role:'tab','aria-selected':tab===kind,'aria-controls':'member-post-panel',tabIndex:tab===kind?0:-1,onClick:()=>setTab(kind),onKeyDown:event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();switchTab(event.key==='Home'?'announcement':event.key==='End'?'bulletin':kind==='announcement'?'bulletin':'announcement');}}},label))),
  h('article',{id:'member-post-panel',role:'tabpanel','aria-labelledby':'member-post-tab-'+tab,className:'member-post-board'},
   h('header',{className:'member-post-board__header'},h('h4',null,tab==='announcement'?'Announcements':'Bulletin'),h('button',{type:'button',disabled:loading,onClick:()=>setRevision(value=>value+1)},'Refresh')),
   tab==='bulletin' && h('label',{className:'member-bulletin-filter'},h('span',null,'Category'),h('select',{value:category,onChange:event=>setCategory(event.target.value)},['All updates',...categories].map(value=>h('option',{key:value,value},value)))),
   loading?h('p',{role:'status'},'Loading parish posts…'):errors[tab]?h('p',{role:'alert',className:'member-post-error'},errors[tab]):
   h('div',{className:'member-post-table-wrap'},h('table',{className:'member-post-table'},
    h('caption',{className:'member-post-table-caption'},tab==='announcement'?'Published parish dates and activities':'Published parish bulletins'),
    h('thead',null,h('tr',null,headers.map(label=>h('th',{key:label,scope:'col'},label)))),
    rows.length?rows.map(post=>h('tbody',{key:post.id||post.title},tab==='announcement'?activityRows(post).map((item,index)=>h('tr',{key:index},
     h('td',null,dateLabel(item.date)),h('td',null,h('div',{className:'member-post-content'},item.activity),index===0?h(AnnouncementPhotos,{React:R,row:post}):null))):
     h('tr',null,h('td',null,dateLabel(post.published_at||post.created_at)),h('td',null,post.title),h('td',null,post.category||'Parish matters'),h('td',null,h('div',{className:'member-post-content'},post.content||'—'),h(AnnouncementPhotos,{React:R,row:post}))))):
     h('tbody',null,h('tr',null,h('td',{colSpan:headers.length},empty)))))));
}
