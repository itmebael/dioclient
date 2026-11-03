import assert from 'node:assert/strict';
import {ClientNotifications,ClientNotificationIndicator} from '../dist/assets/client-notifications.js';
const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
globalThis.sessionStorage={getItem:()=>JSON.stringify({userId:'notification-test'})};
globalThis.window=new EventTarget();
function mount(Component,items){
 const states=[],effects=[];let index=0;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat()}),useState:init=>{const i=index++;if(!(i in states))states[i]=typeof init==='function'?init():init;return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useEffect:(fn,deps)=>{const i=index++;if(!effects[i]||deps.some((value,j)=>effects[i].deps[j]!==value)){effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};}}};
 return {render(){index=0;return Component({React,items});},close(){effects.forEach(e=>e?.cleanup?.());}};
}
function nodes(root,predicate){if(!root||typeof root!=='object')return [];return [...(predicate(root)?[root]:[]),...(root.children||[]).flatMap(child=>nodes(child,predicate))];}
const items=[{_key:'first',title:'First notification'},{_key:'second',title:'Second notification'}];
const indicator=mount(ClientNotificationIndicator,items),menu=mount(ClientNotifications,items);
assert.equal(indicator.render().props.className,'notification-dot');
let view=menu.render();
const checkbox=nodes(view,n=>n.type==='input'&&n.props['aria-label']==='Select First notification')[0];
let stopped=false;checkbox.props.onClick({stopPropagation(){stopped=true;}});assert.equal(stopped,true);
checkbox.props.onChange({target:{checked:true}});
view=menu.render();
assert.equal(nodes(view,n=>n.props.className==='notification-item--read').length,0);
nodes(view,n=>n.type==='button'&&n.children.includes('Mark as read'))[0].props.onClick();
view=menu.render();
assert.equal(nodes(view,n=>n.props.className?.includes('notification-item--read')).length,1);
assert.ok(indicator.render(),'Other unread notifications keep the dot visible');
nodes(view,n=>n.props.className==='notification-item__content'&&n.children[0].children[0]==='Second notification')[0].props.onClick({stopPropagation(){}});
assert.equal(indicator.render(),null,'Clicking the last unread notification clears the bell dot');
menu.close();indicator.close();
const reopened=mount(ClientNotifications,items),reloadedIndicator=mount(ClientNotificationIndicator,items);
assert.equal(nodes(reopened.render(),n=>n.props.className?.includes('notification-item--read')).length,2);
assert.equal(reloadedIndicator.render(),null,'Read state persists on remount/reload');
const newIndicator=mount(ClientNotificationIndicator,[...items,{_key:'new',title:'New notification'}]);
assert.ok(newIndicator.render(),'New notifications restore the unread dot');
reopened.close();reloadedIndicator.close();newIndicator.close();
console.log('PASS: selection, mark as read, click to read, unread indicator, persistence, and new notifications.');
