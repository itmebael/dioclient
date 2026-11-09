// Scale each screen's existing type hierarchy, including fixed-pixel theme rules.
const root=document.documentElement;
const style=document.createElement('style');
style.id='client-text-size-rules';document.head.append(style);
let scheduled=false;
function refresh(){
 scheduled=false;
 const scale=Number(root.dataset.textScale)||1.3;
 const login=!location.hash||/#login/i.test(location.hash);
 style.sheet.disabled=true;
 const previous=root.style.fontSize;
 root.style.fontSize=(16*(login?1.15:1.3))+'px';
 const elements=[...document.querySelectorAll('#root :is(h1,h2,h3,h4,h5,h6,p,span,strong,small,label,button,input,select,textarea,a,li,td,th,dt,dd,legend,option), #root div')].filter(el=>el.tagName!=='DIV'||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
 const sizes=elements.map(el=>parseFloat(getComputedStyle(el).fontSize));
 root.style.fontSize=previous;
 const rules=[];
 elements.forEach((el,index)=>{el.dataset.textSizeId=String(index);if(Number.isFinite(sizes[index]))rules.push('[data-text-size-id="'+index+'"]{font-size:'+sizes[index]*(login?1:scale/1.3)+'px!important}');});
 style.textContent='@layer client-text-size{@media screen{'+rules.join('')+'}}';
 style.sheet.disabled=false;
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
window.addEventListener('client-text-size-change',schedule);
window.addEventListener('resize',schedule);
window.addEventListener('hashchange',schedule);
const app=document.getElementById('root');
if(app)new MutationObserver(schedule).observe(app,{subtree:true,childList:true});
schedule();
