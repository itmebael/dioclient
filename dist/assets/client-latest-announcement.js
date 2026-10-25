import { parseAnnouncementActivities } from './announcement-activities.js';

export function LatestAnnouncement({React:R,data,onNavigate}) {
 const h=R.createElement,post=data.latestAnnouncement;
 const activities=post?parseAnnouncementActivities(post):[];
 const date=new Date(post?.published_at||post?.created_at||'');
 return h('article',{className:'client-latest-announcement','aria-labelledby':'latest-announcement-title'},
  h('header',{className:'user-home-card__header'},
   h('h4',{id:'latest-announcement-title'},'Latest Announcement'),
   h('button',{type:'button',onClick:()=>onNavigate('user-announcement')},'View All')),
  h('div',{className:'client-latest-announcement__body','aria-live':'polite'},
   data.isLoading?h('p',{role:'status'},'Loading the latest announcement…'):
   post?h(R.Fragment,null,
    h('h5',null,post.title||'Parish announcement'),
    !Number.isNaN(date.getTime())?h('time',{dateTime:date.toISOString()},date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})):null,
    h('p',null,activities[0]?.activity||post.content||post.description||'Open announcements to read this parish update.'),
    h('button',{type:'button',className:'client-latest-announcement__read',onClick:()=>onNavigate('user-announcement')},'Read announcement →')):
   h(R.Fragment,null,h('strong',null,data.message?'Announcements are currently unavailable':'No announcements yet'),
    h('p',null,data.message?'Open announcements to try again.':'Published parish updates will appear here.'))));
}
