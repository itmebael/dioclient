import fs from 'node:fs';
const file = 'dist/assets/index-v20260422157000.js';
let source = fs.readFileSync(file, 'utf8');
function replace(before, after) {
  if (!source.includes(before)) throw new Error('Missing source: ' + before.slice(0,120));
  source = source.replace(before, after);
}
replace('function Pg({workspaceSession:e}){', 'function Pg({workspaceSession:e,initialMode="appointment"}){const [bookingMode,setBookingMode]=N.useState(initialMode),[calendarFilter,setCalendarFilter]=N.useState("all");N.useEffect(()=>setBookingMode(initialMode),[initialMode]);const showSchedule=item=>calendarFilter==="all"||(calendarFilter==="mass"?/mass/i.test(item.title+" "+item.badge):item.id.startsWith("booking-"));');
replace('se=D[o]||[],$=o<s', 'se=(D[o]||[]).filter(showSchedule),$=o<s');
replace('className:"screen-grid",children:[n.jsxs("article",{className:"user-panel user-panel--wide",children:[n.jsxs("div",{className:"user-panel__header user-panel__header--stack",children:[n.jsxs("div",{children:[n.jsx("h4",{children:"Appointments"})', 'className:"screen-grid schedules-bookings",children:[n.jsxs("article",{className:"user-panel user-panel--wide schedules-calendar-panel",children:[n.jsxs("div",{className:"user-panel__header user-panel__header--stack",children:[n.jsxs("div",{children:[n.jsx("h4",{children:"Parish calendar"})');
replace('children:"Choose an open parish date and request a visit time."', 'children:"Choose a date to view schedules and submit a request."');
replace('n.jsxs("div",{className:"user-appointment-layout",children:[', 'n.jsxs("div",{className:"schedule-filters","aria-label":"Filter calendar view",children:[["all","All schedules"],["mass","Parish Masses"],["booking","Booking availability"]].map(([value,label])=>n.jsx("button",{type:"button","aria-pressed":calendarFilter===value,onClick:()=>setCalendarFilter(value),children:label},value))}),n.jsxs("div",{className:"user-appointment-layout",children:[');
replace('const C=D[_.dateKey]||[],b=_.dateKey<s,F=C.length>0', 'const C=(D[_.dateKey]||[]).filter(showSchedule),b=_.dateKey<s,F=!!Object.keys(Tm[_.dateKey]||{}).length');
replace('"Open date"]', '"Fully open"]');
replace('"Event / full day"]', '"Partial bookings / events"]');
replace('className:"user-appointment-legend__dot user-appointment-legend__dot--today"}),"Today"]', 'className:"user-appointment-legend__dot user-appointment-legend__dot--full"}),"Fully booked"]');
replace('children:"Selected Date"', 'children:"Day’s schedule"');
replace('children:le?"Open for request":$?"Past date":"Already booked"', 'children:w?"Checking availability":p?"Availability unverified":le?(Object.keys(Tm[o]||{}).length?"Partially booked":"Fully open"):$?"Past date":"Fully booked"');
replace('title:"Open appointment date",message:"No parish event or booking is saved on this date."', 'title:"No matching schedules",message:"No saved items match this date and calendar filter."');
replace('C&&O()', 'void C');
replace('n.jsxs("article",{className:"user-panel user-panel--wide",children:[n.jsxs("div",{className:"user-panel__header",children:[n.jsx("h4",{children:"Book Parish Appointment"})', 'n.jsxs("article",{className:"user-panel user-panel--wide schedules-request-panel",children:[n.jsxs("div",{className:"user-panel__header",children:[n.jsx("h4",{children:"Submit a booking request"})');
replace('u?n.jsx(Q,{tone:u.tone,title:u.title,message:u.message}):null,n.jsxs("form",{ref:a', 'n.jsx("div",{className:"booking-kind","aria-label":"Request type",children:[["appointment","Appointment"],["certificate","Request Certificate"]].map(([value,label])=>n.jsx("button",{type:"button","aria-pressed":bookingMode===value,onClick:()=>setBookingMode(value),children:label},value))}),bookingMode==="certificate"?n.jsx(Lg,{workspaceSession:e,selectedDate:o}):null,bookingMode==="appointment"&&u?n.jsx(Q,{tone:u.tone,title:u.title,message:u.message}):null,n.jsxs("form",{hidden:bookingMode!=="appointment",ref:a');
replace('children:j?"Submitting...":"Submit Appointment"', 'children:j?"Submitting...":"Submit Booking Request"');
replace('function Lg({workspaceSession:e}){', 'function Lg({workspaceSession:e,selectedDate}){');
replace('name:"bookingDate",type:"date",defaultValue:Ae(new Date),required:!0', 'name:"bookingDate",type:"date",defaultValue:selectedDate||Ae(new Date),min:Ae(new Date),required:!0');
replace('case"user-certificate":return n.jsx(Lg,{workspaceSession:a});', 'case"user-certificate":return n.jsx(Pg,{workspaceSession:a,initialMode:"certificate"},"certificates");');
replace('case"user-services":return n.jsx(MemberServices,{React:N,onNavigate:i});', 'case"user-services":return n.jsx(Pg,{workspaceSession:a},"services");');
for (const route of ['user-services','user-appointments','user-certificate']) {
  const pattern = new RegExp('"'+route+'":\\{title:"[^"]*",description:"[^"]*",badge:"[^"]*"\\}');
  if (!pattern.test(source)) throw Error('Missing route '+route);
  source=source.replace(pattern, '"'+route+'":{title:"Schedules & Bookings",description:"View parish schedules, request a certificate, or book an appointment.",badge:"Parish services"}');
}
source=source.replaceAll('label:"Certificates & Appointments"','label:"Schedules & Bookings"').replaceAll('title:"Certificates & Appointments"','title:"Schedules & Bookings"');
source=source.replace('case"user-appointments":return n.jsx(Pg,{workspaceSession:a});','case"user-appointments":return n.jsx(Pg,{workspaceSession:a},"appointments");');
fs.writeFileSync(file,source);
