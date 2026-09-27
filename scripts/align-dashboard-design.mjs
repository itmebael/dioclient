import fs from 'node:fs';
const file='dist/assets/index-v20260422157000.js';
let source=fs.readFileSync(file,'utf8');
function replace(old,next) { if(!source.includes(old)) throw Error('Missing: '+old); source=source.replace(old,next); }
source='import { MemberServices } from "./member-services.js";\n'+source;
replace('ra=[{id:"user-dashboard",label:"Dashboard",icon:"dashboard"},','ra=[{id:"user-dashboard",label:"Dashboard",icon:"dashboard"},{id:"user-services",label:"Certificates & Appointments",icon:"calendar"},');
replace('children:g.map(b=>{const F=t===b.id;', 'children:g.filter(b=>!["user-certificate","user-appointments"].includes(b.id)).map(b=>{const F=t===b.id||(b.id==="user-services"&&["user-certificate","user-appointments"].includes(t));');
replace('"user-services":{title:"User Services",description:"Access certificate requests, intentions, blessings, and member services.",badge:"Services"}', '"user-services":{title:"Certificates & Appointments",description:"Request a parish certificate or arrange a visit with the parish office.",badge:"Parish services"}');
replace('case"user-services":return n.jsx(Vc,{userProfile:s,workspaceSession:a});','case"user-services":return n.jsx(MemberServices,{React:N,onNavigate:i});');
replace('kf=[{title:"Request Certificate",description:"Baptism, Confirmation, & Marriage",route:"user-certificate",icon:"certificate",tone:"blue"},{title:"Book Now",description:"Schedule a Visit to the Parish Office",route:"user-appointments",icon:"calendar",tone:"gold"},', 'kf=[{title:"Certificates & Appointments",description:"Request a certificate or book a parish office visit",route:"user-services",icon:"calendar",tone:"blue"},');
replace('children:[n.jsx("p",{children:"Welcome to the Our Lady of the Annunciation Parish"}),n.jsx("h3",{children:"Welcome!"}),n.jsx("span",{children:"Calbiga, Samar"}),n.jsx("span",{children:"How can we help you today?"})]', 'children:[n.jsx("span",{className:"member-hero-eyebrow",children:"PARISH COMMUNITY"}),n.jsx("h3",{children:"Welcome to the Our Lady of the Annunciation Parish"}),n.jsx("span",{className:"member-hero-location",children:"Calbiga, Samar"})]');
replace('"Latest Announcement"]','"Parish Announcements"]');
replace('children:"View Announcements"','children:"View All"');
fs.writeFileSync(file,source);
