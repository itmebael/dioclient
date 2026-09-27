const EVENT = 'parishlink-preferences';
const defaults = {theme:'light', notifications:true, prayerFeed:true};
export function preferenceKey(session) {
  return 'parishlink-preferences:' + (session?.userId || session?.user?.id || session?.email || 'guest');
}
export function readPreferences(session) {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey(session)) || '{}');
    return {theme:saved.theme === 'dark' ? 'dark' : 'light', notifications:saved.notifications !== false, prayerFeed:saved.prayerFeed !== false};
  } catch { return {...defaults}; }
}
export function savePreference(session, name, value) {
  const next = {...readPreferences(session), [name]:value};
  localStorage.setItem(preferenceKey(session), JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}
export function usePreferences(React, session) {
  const key = preferenceKey(session);
  const [value, setValue] = React.useState(() => readPreferences(session));
  React.useEffect(() => {
    const refresh = () => setValue(readPreferences(session));
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, [key]);
  return value;
}
export function MemberPreferences({React, session}) {
  const h = React.createElement;
  const prefs = usePreferences(React, session);
  const [status, setStatus] = React.useState('');
  const change = (key, value) => {
    try { savePreference(session, key, value); setStatus('Saved for this account in this browser.'); }
    catch { setStatus('Could not save preferences. Browser storage may be unavailable.'); }
  };
  const row = (id, title, description, control) => h('div', {className:'settings-item', key:id},
    h('div', null, h('strong', {id}, title), h('span', {id:id+'-help'}, description)), control);
  const toggle = (id, key) => h('button', {type:'button', role:'switch', 'aria-checked':prefs[key], 'aria-labelledby':id, 'aria-describedby':id+'-help', className:'member-preference-switch', onClick:()=>change(key,!prefs[key])},
    h('span', {'aria-hidden':true,className:'member-preference-switch__track'}, h('span')), prefs[key] ? 'On' : 'Off');
  return h('article', {className:'user-panel user-panel--wide member-preferences'},
    h('div', {className:'user-panel__header'}, h('h4', null, 'Settings'), h('span', null, 'Saved on this browser')),
    h('div', {className:'settings-list'},
      row('member-notifications','Notification reminders','Show pop-up alerts for request updates and parish messages. Updates remain in your notification inbox.',toggle('member-notifications','notifications')),
      row('member-prayer','Prayer feed updates','Show published prayer-related parish notices on your dashboard.',toggle('member-prayer','prayerFeed'))),
    h('p', {className:'member-preference-status',role:'status'}, status));
}
export function PrayerFeed({React,session,notices=[],onNavigate}) {
  const h=React.createElement, prefs=usePreferences(React,session);
  if(!prefs.prayerFeed)return null;
  const prayers=notices.filter(item=>/\b(prayer|pray|intention|rosary|novena)\b/i.test(`${item.title||''} ${item.content||''}`));
  return h('article',{className:'user-home-card member-prayer-feed'},
    h('div',{className:'user-home-card__header'},h('h4',null,'Prayer updates'),h('button',{type:'button',onClick:()=>onNavigate('user-announcement')},'View notices')),
    prayers.length ? prayers.slice(0,3).map(item=>h('div',{className:'member-prayer-feed__item',key:item.id||item.title},h('strong',null,item.title),h('p',null,item.content))) :
    h('div',{className:'empty-state'},h('strong',null,'No prayer updates yet'),h('span',null,'Published parish prayer notices will appear here.')));
}
