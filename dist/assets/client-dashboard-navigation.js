(() => {
 function update(){
  const frame=document.querySelector('.dashboard-frame--user');if(!frame)return;
  const bar=frame.querySelector('.workspace__topbar');if(!bar||bar.querySelector('.client-dashboard-home'))return;
  const home=document.createElement('a');home.className='client-dashboard-home';home.href='#user-dashboard';home.textContent='ParishLink � Dashboard';bar.prepend(home);
  const logout=frame.querySelector('.nav-item--logout');
  if(logout){const button=document.createElement('button');button.type='button';button.className='client-dashboard-logout';button.textContent='Log out';button.onclick=()=>logout.click();bar.append(button);}
 }
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update();});}).observe(document.body,{childList:true,subtree:true});update();
})();
