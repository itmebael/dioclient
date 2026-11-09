import {groupedAnnouncementRows} from './announcement-kind.js?v=20261106-matched-announcements';
import {scheduleTime} from './schedule-time.js';
import {AnnouncementPhotos} from './announcement-reports.js?v=20261008-social-feed';
function dateLabel(value){const date=new Date(value+'T00:00:00');return Number.isNaN(date.getTime())?'\u2014':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
export function AnnouncementSummaryTables({React:R,posts}) {
 const h=R.createElement,groups=groupedAnnouncementRows(posts);
 function table(kind,title,columns,rows) {
  const seen=new Set(),postCount=new Set(rows.map(row=>row.post)).size;
  const body=rows.map(row=>{
   const first=!seen.has(row.post);seen.add(row.post);
   const photos=first?h(AnnouncementPhotos,{React:R,row:row.post}):null;
   return h('tr',{key:row.key},
    h('td',{'data-label':'Date'},dateLabel(row.date)),
    ...(kind==='latest'?[
     h('td',{'data-label':'Activities',key:'activity'},row.activity||'\u2014',photos)
    ]:[
     h('td',{'data-label':'Time',key:'time'},scheduleTime(row.time||row.post.start_time||row.post.event_time)||'\u2014'),
     h('td',{'data-label':'Barangay',key:'barangay'},row.barangay||'\u2014'),
     h('td',{'data-label':'Organization',key:'organization'},row.organization||'\u2014',photos)
    ]));
  });
  return h('section',{className:'social-post announcement-summary-section','data-announcement-kind':kind,'aria-labelledby':'announcement-'+kind+'-title'},
   h('header',{className:'announcement-summary-header'},h('h4',{id:'announcement-'+kind+'-title'},title),h('span',null,postCount+' '+(postCount===1?'post':'posts'))),
   h('div',{className:'announcement-activity-table-wrap',role:'region',tabIndex:0,'aria-label':title},
    h('table',{className:'announcement-activity-table'},
     h('thead',null,h('tr',null,columns.map(label=>h('th',{key:label,scope:'col'},label)))),
     h('tbody',null,body.length?body:h('tr',null,h('td',{colSpan:columns.length,className:'announcement-summary-empty'},kind==='latest'?'No published announcements yet.':'No Sunday Mass sponsors posted yet.'))))));
 }
 return h('div',{className:'social-post-list announcement-summary-tables'},
  table('sponsors','Sunday Mass Sponsors',['Date','Time','Barangay','Organization'],groups.sponsors),
  table('latest','Latest Announcements',['Date','Activities'],groups.latest));
}