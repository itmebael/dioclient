import { RequestProgress } from './request-progress.js';
const zone='Asia/Singapore';
const normalize=row=>String(row.booking_status||'Submitted').trim().toLowerCase();
export function requestCategory(row){const status=normalize(row);return /^(rejected|declined|disapproved)$/.test(status)?'rejected':/^(cancelled|canceled)$/.test(status)?'cancelled':/^(confirmed|approved|scheduled|ready|ready for release)$/.test(status)?'confirmed':/^(completed|released|collected)$/.test(status)?'completed':'pending';}
const day=value=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
function formatDate(value,time=false){if(!value||!Number.isFinite(Date.parse(value)))return 'Not scheduled';return new Intl.DateTimeFormat('en-PH',{timeZone:zone,month:'short',day:'numeric',year:'numeric',...(time?{hour:'numeric',minute:'2-digit'}:{})}).format(new Date(value));}
function Details({React:R,row,onClose,onCancel,onDelete,busy,act}) {
 const h=R.createElement,ref=R.useRef(null);
 R.useEffect(()=>{
  const dialog=ref.current;dialog.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';
  const original=document.querySelector('.dashboard-frame--user > .phone-bottom-nav');
  let navigation;
  if(original){navigation=original.cloneNode(true);navigation.classList.add('booking-detail-bottom-nav');navigation.setAttribute('aria-label','Booking detail navigation');navigation.querySelectorAll('a').forEach(link=>{if(link.hash==='#user-my-requests')link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});navigation.addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;event.preventDefault();if(busy)return;const destination=link.hash;onClose();window.location.hash=destination;});dialog.append(navigation);}
  return()=>{navigation?.remove();dialog.close();document.body.style.overflow=old;};
 },[]);
 const details=[['Service',row.service_name||'Parish service'],['Date',formatDate(row.booking_date)],['Time',row.booking_time||row.appointment_time||'Not specified'],['Name',row.client_name||[row.client_first_name,row.client_middle_name,row.client_last_name].filter(Boolean).join(' ')||'Not provided'],['Parish',row.parish_name||'Not provided']];
 return h('dialog',{ref,className:'my-booking-details my-booking-detail-screen','aria-labelledby':'my-booking-detail-title',onCancel:e=>{e.preventDefault();if(!busy)onClose();}},
 h('header',{className:'booking-detail-topbar'},h('button',{type:'button',onClick:onClose,'aria-label':'Back to My Bookings',disabled:!!busy},'\u2190'),h('h3',{id:'my-booking-detail-title'},'My Booking')),
 h('div',{className:'booking-detail-content'},
 h('section',{className:'booking-detail-summary'},h('span',{className:'booking-detail-badge'},row.booking_status||'Submitted'),h('span',{className:'booking-detail-label'},'Booking reference'),h('h2',null,row.reference_number||'Reference pending'),h('p',null,'Submitted on ',formatDate(row.created_at,true),' (Philippine time)')),
 h('section',{className:'booking-detail-progress'},h(RequestProgress,{React:R,row})),
 h('section',{className:'booking-detail-information'},h('h4',null,'Booking Details'),h('dl',null,details.map(([label,value])=>h('div',{key:label},h('dt',null,label),h('dd',null,value))))),
 row.certificate_file_url&&/^https?:\/\//i.test(row.certificate_file_url)?h('a',{className:'booking-detail-certificate',href:row.certificate_file_url,target:'_blank',rel:'noopener noreferrer'},'View certificate'):null,
 h('footer',{className:'booking-detail-actions'},requestCategory(row)==='pending'&&onCancel?h('button',{type:'button',disabled:!!busy,onClick:()=>act(row,onCancel,'Cancel')},busy?'Updating...':'Cancel request'):null,['cancelled','rejected'].includes(requestCategory(row))&&onDelete?h('button',{type:'button',disabled:!!busy,onClick:()=>act(row,onDelete,'Delete')},busy?'Updating...':'Delete request'):null,h('button',{type:'button',disabled:!!busy,onClick:onClose},'Back to My Bookings'))));
}
export function RequestsTable({React:R,rows=[],loading,error,onCancel,onDelete}){
 const h=R.createElement,[filter,setFilter]=R.useState('all'),[selected,setSelected]=R.useState(null),[busy,setBusy]=R.useState(null),[actionError,setActionError]=R.useState('');
 const today=day(new Date()),upcoming=rows.filter(row=>!['cancelled','rejected','completed'].includes(requestCategory(row))&&row.booking_date&&Number.isFinite(Date.parse(row.booking_date))&&day(row.booking_date)>=today).length;
 const visible=rows.filter(row=>filter==='all'||requestCategory(row)===filter);
 async function act(row,callback,verb){if(busy||!callback||!window.confirm(verb+' this request?'))return;setBusy(row.id);setActionError('');try{await callback(row);setSelected(null);}catch(e){setActionError(e.message||'Could not update the request.');}finally{setBusy(null);}}
 return h('section',{className:'my-bookings','aria-label':'My bookings'},
 h('div',{className:'my-bookings-stats'},[['Total Requests',rows.length],['Pending',rows.filter(r=>requestCategory(r)==='pending').length],['Confirmed',rows.filter(r=>requestCategory(r)==='confirmed').length],['Cancelled',rows.filter(r=>requestCategory(r)==='cancelled').length]].map(([label,count])=>h('div',{key:label},h('span',null,label),h('strong',null,loading||error?'�':count)))),
 h('label',{className:'my-bookings-status-filter'},h('span',null,'Request status'),h('select',{value:filter,onChange:event=>setFilter(event.target.value)},['all','confirmed','pending','rejected','cancelled','completed'].map(value=>h('option',{key:value,value},value==='all'?'All requests':value[0].toUpperCase()+value.slice(1))))),
 actionError?h('p',{role:'alert'},actionError):null,
 !loading&&!error&&!visible.length?h('p',{className:'my-bookings-empty'},rows.length?'No requests in this category.':'No bookings or certificate requests yet.'):null,
 h('div',{className:'my-bookings-cards'},visible.map(row=>h('article',{key:row.id,className:'my-booking-card'},h('span',{className:'my-booking-status'},row.booking_status||'Submitted'),h('h4',null,row.service_name||'Parish service request'),h('p',null,'Submitted: ',formatDate(row.created_at,true)),h('p',null,'Schedule: ',formatDate(row.booking_date)),h('p',{className:'my-booking-reference'},row.reference_number||'Reference pending'),h('div',{className:'my-booking-card-actions'},h('button',{type:'button',onClick:()=>setSelected(row)},'View Details'),h('span',{'aria-label':'Request status'},row.booking_status||'Submitted'))))),
 selected?h(Details,{React:R,row:selected,onClose:()=>setSelected(null),onCancel,onDelete,busy,act}):null);
}
