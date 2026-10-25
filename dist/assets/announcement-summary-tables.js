import {groupedAnnouncementRows} from './announcement-kind.js';
import {scheduleTime} from './schedule-time.js';
import {AnnouncementPhotos} from './announcement-reports.js?v=20261008-social-feed';
function dateLabel(value){const date=new Date(value+'T00:00:00');return Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
export function AnnouncementSummaryTables({React:R,posts}){
 const h=R.createElement,groups=groupedAnnouncementRows(posts);
 function table(kind,title,columns,rows){
  return h('section',{className:'social-post announcement-summary-section','data-announcement-kind':kind,'aria-labelledby':'announcement-'+kind+'-title'},
   h('header',{className:'announcement-summary-header'},h('h4',{id:'announcement-'+kind+'-title'},title),h('span',null,rows.length+' '+(rows.length===1?'entry':'entries'))),
   h('div',{className:'announcement-activity-table-wrap',role:'region',tabIndex:0,'aria-label':title},
    h('table',{className:'announcement-activity-table'},
     h('thead',null,h('tr',null,columns.map(label=>h('th',{key:label,scope:'col'},label)))),
     h('tbody',null,rows.length?rows.map(row=>h('tr',{key:row.key},
      h('td',{'data-label':'Date'},dateLabel(row.date)),
      ...(kind==='latest'?[h('td',{'data-label':'Activities',key:'activity'},row.activity||'—',row.index===0?h(AnnouncementPhotos,{React:R,row:row.post}):null)]:[
       h('td',{'data-label':'Time',key:'time'},scheduleTime(row.time||row.post.start_time||row.post.event_time)||'—'),
       h('td',{'data-label':'Barangay',key:'barangay'},row.barangay||'—'),
       h('td',{'data-label':'Organization',key:'organization'},row.organization||'—')]))):h('tr',null,h('td',{colSpan:columns.length,className:'announcement-summary-empty'},kind==='latest'?'No published announcements yet.':'No Sunday Mass sponsors posted yet.'))))));
 }
 return h('div',{className:'social-post-list announcement-summary-tables'},
  table('latest','Latest Announcements',['Date','Activities'],groups.latest),
  table('sponsors','Sunday Mass Sponsor',['Date','Time','Barangay','Organization'],groups.sponsors));
}
