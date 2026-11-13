const cfg = window.APP_CONFIG;
const $ = id => document.getElementById(id);
function showStudy(on) { $('login-panel').hidden=on; $('study-panel').hidden=!on; $('logout').hidden=!on; }
function clearRound() { $('round').innerHTML='<div class="empty"><span class="empty-kanji">学</span><h2>Sẵn sàng học một từ mới?</h2><p class="muted">Bấm “Từ ngẫu nhiên” để bắt đầu.</p></div>'; }
if(cfg.demo) {
  startDemo();
} else if(!cfg.apiBaseUrl || !window.htmx) {
  $('login-message').textContent='Chưa cấu hình API hoặc chưa tải được HTMX.';
  $('login-form').addEventListener('submit',e=>e.preventDefault());
} else {
  const api=cfg.apiBaseUrl.replace(/\/$/,'')+'/practice';
  htmx.config.selfRequestsOnly=false;
  htmx.config.allowEval=false;
  htmx.config.allowScriptTags=false;
  htmx.config.historyCacheSize=0;
  htmx.config.timeout=20000;
  $('random').setAttribute('hx-post',api+'/random');htmx.process($('random'));
  function expire() {AuthAPI.clear();clearRound();showStudy(false);$('login-message').textContent='Phiên đã hết hạn. Vui lòng đăng nhập lại.';}
  document.body.addEventListener('htmx:validateUrl',e=>{if(![api+'/random',api+'/answer'].includes(e.detail.url.href))e.preventDefault();});
  document.body.addEventListener('htmx:configRequest',e=>{e.detail.headers.Authorization='Bearer '+AuthAPI.token();});
  document.body.addEventListener('htmx:beforeRequest',e=>{if(!AuthAPI.token()){e.preventDefault();expire();}$('network-message').textContent='';});
  for(const event of ['htmx:responseError','htmx:sendError','htmx:timeout'])document.body.addEventListener(event,e=>{
    if(e.detail.xhr?.status===401)expire();
    else $('network-message').textContent='Chưa gửi được. Kiểm tra kết nối rồi thử lại.';
  });
  document.body.addEventListener('htmx:afterSwap',()=>{$('reading')?.focus({preventScroll:true});});
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault();const button=e.submitter;button.disabled=true;$('login-message').textContent='';
    try {await AuthAPI.login($('username').value.trim(),$('password').value);$('password').value='';clearRound();showStudy(true);}
    catch(error){$('login-message').textContent=error.message;}
    finally{button.disabled=false;}
  });
  $('logout').addEventListener('click',async()=>{
    const pending=AuthAPI.logout();clearRound();showStudy(false);
    try{await pending;}catch(error){$('login-message').textContent=error.message;}
  });
}
