import {parseAnnouncementActivities} from './announcement-activities.js?v=20261026-time';
import {scheduleTime} from './schedule-time.js';
function dateLabel(value){const date=new Date(value+'T00:00:00');return Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
export function AnnouncementActivityTable({React:R,post}) {
 const h=R.createElement;
 return h('div',{className:'announcement-activity-table-wrap',role:'region','aria-label':'Announcement activities',tabIndex:0},
  h('table',{className:'announcement-activity-table'},
   h('thead',null,h('tr',null,['Date','Time','Activity','Barangay','Organization'].map(label=>h('th',{key:label,scope:'col'},label)))),
   h('tbody',null,parseAnnouncementActivities(post).map((item,index)=>h('tr',{key:index},
    h('td',{'data-label':'Date'},dateLabel(item.date)),
    h('td',{'data-label':'Time'},scheduleTime(item.time||post.start_time||post.event_time)||'—'),
    h('td',{'data-label':'Activity'},item.activity||'—'),h('td',{'data-label':'Barangay'},item.barangay||'—'),h('td',{'data-label':'Organization'},item.organization||'—'))))));
}
