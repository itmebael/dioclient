(() => {
 const instances=new Map();
 function update(){
  for(const [hero,state]of instances)if(!hero.isConnected){state.resize.disconnect();instances.delete(hero);}
  const hero=document.querySelector('.user-home-hero');if(!hero||instances.has(hero))return;
  const title=hero.querySelector('.user-home-hero__copy h3')?.textContent||'Our Lady of the Annunciation Parish';
  const track=document.createElement('div');track.className='client-hero-carousel';track.tabIndex=0;track.setAttribute('role','region');track.setAttribute('aria-label','Parish photo carousel');
  const photos=[['/dist/assets/admin-hero-banner.png','Parish community banner'],['/dist/assets/hero-church.jpg','Parish church'],['/dist/assets/hero-diocese.jpg','Diocese background']];
  photos.forEach(([src,alt],index)=>{
   const slide=document.createElement('section');slide.className='client-simple-hero client-hero-slide';slide.setAttribute('aria-label',`${index+1} of ${photos.length}: ${alt}`);
   const image=document.createElement('img');image.src=src;image.alt=alt;image.draggable=false;if(index)image.loading='lazy';
   const caption=document.createElement('div');caption.className='client-simple-hero-caption';
   const eyebrow=document.createElement('span');eyebrow.textContent='PARISH COMMUNITY';const heading=document.createElement('h2');heading.textContent=title;const location=document.createElement('p');location.textContent='Calbiga, Samar';caption.append(eyebrow,heading,location);slide.append(image,caption);track.append(slide);
  });
  const controls=document.createElement('div');controls.className='client-hero-carousel-controls';
  const previous=document.createElement('button');previous.type='button';previous.className='hero-carousel-previous';previous.innerHTML='&#8249;';previous.setAttribute('aria-label','Previous banner');
  const next=document.createElement('button');next.type='button';next.className='hero-carousel-next';next.innerHTML='&#8250;';next.setAttribute('aria-label','Next banner');
  const dots=document.createElement('div');dots.className='client-hero-carousel-dots';
  const pause=document.createElement('button');pause.type='button';pause.className='hero-carousel-pause';pause.textContent='Pause';pause.setAttribute('aria-label','Pause automatic carousel');
  const state={index:0,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,hover:false,last:Date.now()};
  const move=index=>{state.index=(index+photos.length)%photos.length;state.last=Date.now();track.scrollTo({left:state.index*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  photos.forEach(([,alt],index)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label','Show '+alt);dot.setAttribute('aria-current',String(index===0));dot.onclick=()=>move(index);dots.append(dot);});
  previous.onclick=()=>move(state.index-1);next.onclick=()=>move(state.index+1);pause.textContent=state.paused?'Play':'Pause';pause.onclick=()=>{state.paused=!state.paused;pause.textContent=state.paused?'Play':'Pause';pause.setAttribute('aria-label',state.paused?'Resume automatic carousel':'Pause automatic carousel');state.last=Date.now();};
  track.addEventListener('scroll',()=>{state.index=Math.round(track.scrollLeft/(track.clientWidth||1));[...dots.children].forEach((dot,index)=>dot.setAttribute('aria-current',String(index===state.index)));},{passive:true});
  track.addEventListener('pointerdown',()=>state.last=Date.now(),{passive:true});track.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(state.index+(event.key==='ArrowLeft'?-1:1));}});
  hero.addEventListener('mouseenter',()=>state.hover=true);hero.addEventListener('mouseleave',()=>state.hover=false);
  controls.append(previous,dots,next);hero.append(track,controls);
  state.resize=new ResizeObserver(()=>track.scrollTo({left:state.index*track.clientWidth,behavior:'instant'}));state.resize.observe(track);state.move=move;instances.set(hero,state);
 }
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}).observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{if(document.hidden)return;for(const [hero,state]of instances)if(hero.isConnected&&!state.paused&&!state.hover&&!hero.contains(document.activeElement)&&Date.now()-state.last>6500)state.move(state.index+1);},1000);update();
})();
