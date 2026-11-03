import assert from 'node:assert/strict';
import {deliveredCertificate, deliveryKey, declinedBooking, bookingNoticeKey, useCertificateDelivery} from '../dist/assets/certificate-delivery.js';
import {requestCategory, RequestsTable} from '../dist/assets/requests-table.js';
const initial={id:'booking-1',reference_number:'CERT-1',service_name:'Baptismal Certificate',booking_status:'Approved'};
const delivered={...initial,booking_status:'Released',certificate_file_url:'https://example.test/certificate.pdf',certificate_uploaded_at:'2026-11-03T03:00:00Z'};
assert.equal(deliveredCertificate(initial),false);
assert.equal(deliveredCertificate({...delivered,booking_status:'Correction'}),false);
assert.equal(deliveredCertificate(delivered),true);
assert.equal(requestCategory(delivered),'completed');
assert.notEqual(deliveryKey(delivered),deliveryKey({...delivered,certificate_uploaded_at:'2026-11-03T04:00:00Z'}));
class Element extends EventTarget {
  children=[];open=false;
  append(...items){this.children.push(...items);}
  setAttribute(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  remove(){this.removed=true;}
}
const body=new Element(), values=new Map();
const doc=new EventTarget();doc.body=body;doc.visibilityState='visible';doc.createElement=()=>new Element();
globalThis.document=doc;
globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
globalThis.CustomEvent=class extends Event {constructor(type,options){super(type);this.detail=options.detail;}};
globalThis.window=new EventTarget();window.location={hash:''};
let interval, cleanup, rows=[initial], queries=[];
window.setInterval=callback=>{interval=callback;return 1;};window.clearInterval=()=>{};
const React={useEffect:fn=>{cleanup=fn();}};
const updates=[];window.addEventListener('member-bookings-updated',event=>updates.push(event.detail));
const fetchRows=async(table,query,token)=>{assert.equal(table,'diocese_service_bookings');assert.equal(token,'owner-token');assert.ok(query.includes('booked_by=eq.owner-1'));queries.push(query);return rows;};
useCertificateDelivery(React,{role:'user',userId:'owner-1',accessToken:'owner-token'},fetchRows);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(body.children.length,0);
rows=[delivered];await interval();
assert.equal(updates.at(-1).rows[0].booking_status,'Released');
assert.equal(body.children.length,1);assert.equal(body.children[0].open,true);
await interval();assert.equal(body.children.length,1,'No repeated popup while open');
body.children[0].children[2].children[0].dispatchEvent(new Event('click'));
assert.equal(window.location.hash,'user-my-requests');assert.equal(body.children[0].removed,true);
await interval();assert.equal(body.children.length,1,'Acknowledged delivery stays dismissed');
cleanup();useCertificateDelivery(React,{role:'user',userId:'owner-1',accessToken:'owner-token'},fetchRows);
await new Promise(resolve=>setTimeout(resolve,0));assert.equal(body.children.length,1,'Delivery stays dismissed after remount');
rows=[{...delivered,certificate_uploaded_at:'2026-11-03T04:00:00Z'}];await interval();assert.equal(body.children.length,2,'Resending opens a new notification');cleanup();
const declined={...initial,booking_status:'Declined',updated_at:'2026-11-03T05:00:00Z'};
assert.equal(declinedBooking(declined),true);
assert.equal(declinedBooking({...declined,booking_status:'Cancelled'}),false);
assert.notEqual(bookingNoticeKey(declined),deliveryKey(delivered));
rows=[declined];useCertificateDelivery(React,{role:'user',userId:'owner-1',accessToken:'owner-token'},fetchRows);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(body.children.length,3);
assert.equal(body.children[2].children[0].textContent,'Your booking was declined');
assert.equal(updates.at(-1).rows[0].booking_status,'Declined');
assert.equal(requestCategory(declined),'rejected');
body.children[2].children[2].children[1].dispatchEvent(new Event('click'));
await interval();assert.equal(body.children.length,3,'Declined notice stays dismissed');cleanup();
// An already-open booking dialog receives the updated row, not its old snapshot.
let stateIndex=0;
const uiReact={createElement:(type,props,...children)=>({type,props,children}),useState:initialValue=>{const values=['all',initial,null,''];return [values[stateIndex++],()=>{}];}};
const table=RequestsTable({React:uiReact,rows:[delivered]});
const detail=table.children.flat().find(node=>typeof node?.type==='function'&&node.type.name==='Details');
assert.equal(detail.props.row.booking_status,'Released');
console.log('PASS: owner-scoped refresh, delivery and decline popups, navigation, dismissal persistence, resend, status categories, and live details.');
