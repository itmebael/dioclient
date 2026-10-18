import fs from 'node:fs';
const file='dist/assets/index-login-20261004-clean-registration.js';
let source=fs.readFileSync(file,'utf8');
const before='function ce({title:e,message:t}){return n.jsxs("div",{className:"empty-state",children:[n.jsx("strong",{children:e}),n.jsx("span",{children:t})]})}';
const after='function ce({title:e,message:t}){return n.jsxs("div",{className:"empty-state client-empty-state",children:[n.jsx("svg",{className:"dashboard-empty-icon",width:48,height:48,viewBox:"0 0 48 48",fill:"none",stroke:"currentColor",strokeWidth:3.5,"aria-hidden":"true",children:n.jsx("path",{d:"M4 18 12 4h24l8 14v26H4V18Zm0 6h12l5 8h6l5-8h12"})}),n.jsx("strong",{children:e}),n.jsx("span",{children:t})]})}';
if(!source.includes(before))throw Error('Client empty-state component not found');
fs.writeFileSync(file,source.replace(before,after));
console.log('Client empty states now use the admin tray icon.');
