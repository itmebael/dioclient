import fs from 'node:fs';

const file = 'dist/assets/index-login-20261004-clean-registration.js';
let source = fs.readFileSync(file, 'utf8');
const replacements = [
  [
    'const j=be(t),uid=getAuthUid(t),A=await Vn("diocese_service_bookings",uid?`select=${m}&booked_by=eq.${encodeURIComponent(uid)}&order=created_at.desc`:`select=id&limit=0`,j);',
    'const j=be(t),A=await fetchMemberRequests({userId:getAuthUid(t),accessToken:j,fetchRows:de});',
  ],
  [
    'Vn("diocese_service_bookings","select=id,reference_number,client_name,service_name,booking_status,booking_date,created_at&order=created_at.desc&limit=3",u)',
    'fetchMemberRequests({userId:getAuthUid(t),accessToken:u,fetchRows:de,limit:3})',
  ],
];
for (const [before, after] of replacements) {
  if (source.includes(after)) continue;
  if (source.split(before).length !== 2) throw new Error('Expected exactly one member query to patch.');
  source = source.replace(before, after);
}
const importLine = 'import { fetchMemberRequests } from "./member-requests.js";\n';
if (!source.includes(importLine.trim())) source = importLine + source;
fs.writeFileSync(file, source);
console.log('Dashboard and My Requests now share the authenticated request loader.');
