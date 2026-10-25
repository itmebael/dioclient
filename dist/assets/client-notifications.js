export function notificationKey(item){return item._key||[item.title,item.meta,item.created_at].join('|');}
export function updateNotificationPreferences(state,keys,action){const next={...state};for(const key of keys)next[key]={...next[key],[action==='delete'?'deleted':'read']:true};return next;}
function accountKey(){let session={};try{session=JSON.parse(sessionStorage.getItem('diocese-dashboard-db-session')||'{}');}catch{}return 'parishlink-client-notifications:'+String(session.userId||session.user?.id||session.email||'guest').toLowerCase();}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}}
export function ClientNotificationIndicator({React:R,items=[]}){
 const key=accountKey(),[preferences,setPreferences]=R.useState(()=>read(key));
 R.useEffect(()=>{const update=e=>{if(!e.key||e.key===key)setPreferences(read(key));};update({});window.addEventListener('storage',update);window.addEventListener('client-notifications-change',update);return()=>{window.removeEventListener('storage',update);window.removeEventListener('client-notifications-change',update);};},[key]);
 const unread=items.some(item=>!item.read&&!preferences[notificationKey(item)]?.read&&!preferences[notificationKey(item)]?.deleted);
 return unread?R.createElement('span',{className:'notification-dot','aria-hidden':true}):null;
}
export function ClientNotifications({React:R,items=[]}){
 const h=R.createElement,key=accountKey(),[preferences,setPreferences]=R.useState(()=>read(key)),[selected,setSelected]=R.useState([]);
 R.useEffect(()=>{setPreferences(read(key));setSelected([]);const update=e=>{if(!e||e.key===key)setPreferences(read(key));};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);},[key]);
 const rows=items.filter(item=>!preferences[notificationKey(item)]?.deleted),unread=rows.filter(item=>!preferences[notificationKey(item)]?.read&&!item.read).length;
 const selectedKeys=selected.filter(key=>rows.some(row=>notificationKey(row)===key));
 function change(action,keys=selectedKeys){const next=updateNotificationPreferences(preferences,keys,action);setPreferences(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{}window.dispatchEvent(new Event('client-notifications-change'));setSelected([]);}
 return h('section',{className:'topbar-menu notification-menu notification-menu--user','aria-label':'Recent activity notifications'},
 h('div',{className:'topbar-menu__header'},h('div',null,h('p',{className:'workspace__eyebrow'},'Notifications'),h('h4',null,'Recent Activity')),h('span',{className:'summary-pill','aria-live':'polite'},unread+' unread')),
 h('div',{className:'client-notification-toolbar'},h('label',null,h('input',{type:'checkbox','aria-label':'Select all notifications',checked:!!rows.length&&selectedKeys.length===rows.length,disabled:!rows.length,onChange:e=>setSelected(e.target.checked?rows.map(notificationKey):[])}),'Select all'),h('button',{type:'button',disabled:!selectedKeys.length,onClick:()=>change('read')},'Mark as read'),h('button',{type:'button',disabled:!selectedKeys.length,onClick:()=>change('delete')},'Delete')),
 h('div',{className:'notification-menu__list'},rows.length?rows.map(item=>{const id=notificationKey(item),isRead=preferences[id]?.read||item.read;return h('div',{key:id,className:'notification-item'+(isRead?' notification-item--read':''),onClick:()=>change('read',[id])},h('input',{type:'checkbox','aria-label':'Select '+item.title,checked:selectedKeys.includes(id),onClick:e=>e.stopPropagation(),onChange:e=>setSelected(e.target.checked?[...selectedKeys,id]:selectedKeys.filter(value=>value!==id))}),!isRead?h('span',{className:'notification-item__dot','aria-hidden':true}):null,h('button',{type:'button',className:'notification-item__content',onClick:e=>{e.stopPropagation();change('read',[id]);}},h('strong',null,item.title),h('span',null,item.meta||'Just now')));}):h('div',{className:'notification-empty'},h('strong',null,'No notifications'),h('span',null,'New activity will appear here.'))));
}
