(() => {
 const icon = type => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({certificate:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/>',announcement:'<path d="M3 10v5h4l11 5V5L7 10zM7 15l2 6h3l-2-5M21 9v7"/>',home:'<path d="m3 10 9-7 9 7v11H3zM9 21V12h6v9"/>',calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/>',profile:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'}[type])+'</svg>';
 function route(hash){const link=document.querySelector('.sidebar__nav [href="#'+hash+'"]');if(link)link.click();else location.hash=hash;}
 document.addEventListener('click',event=>{
  const home=event.target.closest('.phone-nav-home');if(!home)return;
  home.classList.remove('home-tap');void home.offsetWidth;home.classList.add('home-tap');
  setTimeout(()=>home.classList.remove('home-tap'),550);
 });
 function update(){
 const frame=document.querySelector('.dashboard-frame--user');if(!frame)return;
 if(!frame.querySelector('.phone-bottom-nav')){const nav=document.createElement('nav');nav.className='phone-bottom-nav';nav.setAttribute('aria-label','Mobile navigation');nav.innerHTML=[['user-certificate','certificate','Certificates'],['user-my-requests','calendar','Bookings'],['user-dashboard','home','Home'],['user-announcement','announcement','News'],['user-profile-settings','profile','Profile']].map(([hash,type,label])=>'<a href="#'+hash+'" class="phone-nav-'+type+'">'+icon(type)+'<span>'+label+'</span></a>').join('');frame.append(nav);}
 frame.querySelectorAll('.phone-bottom-nav a').forEach(a=>{const active=a.hash===(location.hash||'#user-dashboard');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const dashboard=frame.querySelector('.user-home-dashboard');if(!dashboard||dashboard.querySelector('.phone-welcome'))return;
 let session={};try{session=JSON.parse(sessionStorage.getItem('diocese-dashboard-db-session')||'{}')}catch{}
 const name=String(session.displayName||session.user?.user_metadata?.display_name||'Welcome').split(' ')[0];
 const header=document.createElement('header');header.className='phone-welcome';const hour=new Date().getHours();const greeting=hour<12?'Good morning,':hour<18?'Good afternoon,':'Good evening,';
 const copy=document.createElement('div');const small=document.createElement('span');small.textContent=greeting;const title=document.createElement('h2');title.textContent=name+'!';const text=document.createElement('p');text.textContent='Welcome back! Stay connected with your parish.';copy.append(small,title,text);const notification=document.createElement('button');notification.type='button';notification.setAttribute('aria-label','Open notifications');notification.innerHTML=icon('bell');notification.onclick=()=>frame.querySelector('.notification-toggle,.notification-button,[aria-label*="Notifications"],[aria-label*="notifications"]')?.click();header.append(copy,notification);dashboard.prepend(header);

 }
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})}).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',update);update();
})();
