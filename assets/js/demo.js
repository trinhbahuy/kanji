function startDemo() {
  showStudy(true); $('demo-notice').hidden = false; $('logout').hidden = true;
  const samples = [{kanji:'書きます',read:'かきます',vi:'viết'},{kanji:'図書館',read:'としょかん',vi:'thư viện'},{kanji:'約束',read:'やくそく',vi:'lời hứa; cuộc hẹn'},{kanji:'食べます',read:'たべます',vi:'ăn'}];
  let sample, tries = 0, index = -1;
  function render(message='',done=false,correct=false) {
    $('round').innerHTML = `<div class="round-top"><span>CÁCH ĐỌC LÀ GÌ?</span><span>${3-tries}/3 lần thử</span></div><div class="kanji">${sample.kanji}</div><p class="question-caption">Hãy đọc từ này bằng Hiragana</p>${message?`<div class="feedback ${correct?'success':''}">${message}</div>`:''}${done?`<div class="reveal"><div class="reading">${sample.read}</div><div class="meaning">${sample.vi}</div></div>`:'<form class="answer-form" id="demo-answer"><label for="reading">Cách đọc của bạn</label><input id="reading" name="answer" placeholder="Nhập Hiragana, ví dụ: かきます" autocomplete="off" required maxlength="100"><button class="primary">Kiểm tra <span>↵</span></button></form>'}`;
    $('demo-answer')?.addEventListener('submit',e=>{e.preventDefault();const a=$('reading').value.normalize('NFKC').trim();if(!/^[ぁ-ゖー]+$/.test(a)){ $('network-message').textContent='Hãy nhập cách đọc bằng Hiragana.'; return; }$('network-message').textContent='';tries++;const correct=a===sample.read;render(correct?'Đúng rồi! Thêm một từ đã nhớ.':tries===3?'Hết 3 lần thử. Cùng ghi nhớ từ này nhé.':`Chưa đúng rồi. Bạn còn ${3-tries} lần thử.`,correct||tries===3,correct);});
  }
  $('random').addEventListener('click',()=>{index=(index+1+Math.floor(Math.random()*(samples.length-1)))%samples.length;sample=samples[index];tries=0;$('network-message').textContent='';render();});
}
