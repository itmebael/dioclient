export function ClientDesktopOverview({React:R,parish,data}) {
 const h=R.createElement;
 return h('section',{className:'client-desktop-overview','aria-label':'Your parish overview'},
 h('h4',null,'Your Parish Overview'),
 h('div',{className:'client-desktop-overview-grid'},
 
 h('div',null,h('span',null,'Next Mass'),h('strong',null,data.isLoading?'Loading...':data.message?'Unavailable':data.upcomingMass?.title||'No upcoming Mass')),
 h('div',null,h('span',null,'Recent requests shown'),h('strong',null,data.isLoading?'...':data.message?'Unavailable':String(data.recentRequests?.length||0)))));
}
