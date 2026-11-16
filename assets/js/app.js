const cfg = window.APP_CONFIG;
const $ = id => document.getElementById(id);
const randomEndpoint = cfg.randomKanjiUrl;
const checkEndpoint = cfg.checkReadingUrl;
const randomButton = $('random');
const typeFilter = $('type-filter');
const roundElement = $('round');
const messageElement = $('network-message');
let roundState = null;
let answerRequestPending = false;
let avoidSampleKey = '';
let repeatRetries = 0;

function sampleKey(sample) {
  return `${sample.kanji}\u0000${sample.read}`;
}

function setAnswerBusy(busy) {
  answerRequestPending = busy;
  randomButton.disabled = busy;
  typeFilter.disabled = busy;
  const submit = roundElement.querySelector('#answer-form button');
  if (submit) submit.disabled = busy;
}

function clearRound() {
  roundState = null;
  avoidSampleKey = '';
  repeatRetries = 0;
  roundElement.innerHTML = '<div class="empty"><span class="empty-kanji">学</span><h2>Sẵn sàng học một từ mới?</h2><p class="muted">Bấm “Từ ngẫu nhiên” để bắt đầu.</p></div>';
  messageElement.textContent = '';
}

function showRound() {
  roundElement.innerHTML = Practice.renderRound(roundState);
  $('reading')?.focus({ preventScroll: true });
}

async function checkAnswer(input) {
  setAnswerBusy(true);
  messageElement.textContent = '';
  try {
    const response = await fetch(checkEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: roundState.sample.type,
        kanji: roundState.sample.kanji,
        input,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error('API kiểm tra chưa phản hồi thành công.');
    const correct = Practice.parseCheckResponse(await response.text());
    roundState = Practice.applyCheckResult(roundState, correct);
    showRound();
  } catch (error) {
    messageElement.textContent = error.name === 'TimeoutError'
      ? 'Kiểm tra đáp án quá thời gian. Vui lòng thử lại.'
      : error.message || 'Chưa kiểm tra được đáp án. Vui lòng thử lại.';
  } finally {
    setAnswerBusy(false);
  }
}

typeFilter.addEventListener('change', clearRound);

roundElement.addEventListener('submit', event => {
  if (event.target.id !== 'answer-form') return;
  event.preventDefault();
  if (answerRequestPending) return;
  const input = $('reading').value;
  if (!Practice.isValidReading(input)) {
    roundState = Practice.validationError(roundState);
    showRound();
    return;
  }
  checkAnswer(input);
});

roundElement.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || answerRequestPending) return;
  if (button.id === 'reveal-answer') {
    roundState = Practice.revealAnswer(roundState);
    showRound();
  }
  if (button.id === 'continue') {
    avoidSampleKey = sampleKey(roundState.sample);
    repeatRetries = 0;
    messageElement.textContent = '';
    randomButton.click();
  }
});

if (!randomEndpoint || !checkEndpoint || !window.htmx) {
  randomButton.disabled = true;
  messageElement.textContent = 'Chưa cấu hình API hoặc chưa tải được HTMX.';
} else {
  htmx.config.selfRequestsOnly = false;
  htmx.config.allowEval = false;
  htmx.config.allowScriptTags = false;
  htmx.config.historyCacheSize = 0;
  htmx.config.timeout = 20000;
  randomButton.setAttribute('hx-get', randomEndpoint);
  htmx.process(randomButton);

  document.body.addEventListener('htmx:configRequest', event => {
    if (event.detail.elt === randomButton) Practice.removeHtmxHeaders(event.detail.headers);
  });
  document.body.addEventListener('htmx:validateUrl', event => {
    const requested = new URL(event.detail.url.href);
    const allowed = new URL(randomEndpoint);
    if (requested.origin !== allowed.origin || requested.pathname !== allowed.pathname) event.preventDefault();
  });
  document.body.addEventListener('htmx:beforeRequest', event => {
    if (event.detail.elt === randomButton) messageElement.textContent = '';
  });
  document.body.addEventListener('htmx:afterRequest', event => {
    if (event.detail.elt !== randomButton || !event.detail.successful) return;
    try {
      const sample = Practice.parseRandomResponse(event.detail.xhr.responseText);
      if (avoidSampleKey && sampleKey(sample) === avoidSampleKey && repeatRetries < 5) {
        repeatRetries += 1;
        setTimeout(() => randomButton.click(), 0);
        return;
      }
      avoidSampleKey = '';
      repeatRetries = 0;
      roundState = Practice.startRound(sample, typeFilter.value);
      showRound();
    } catch (error) {
      messageElement.textContent = error.message;
    }
  });
  for (const eventName of ['htmx:responseError', 'htmx:sendError', 'htmx:timeout']) {
    document.body.addEventListener(eventName, event => {
      if (event.detail.elt === randomButton) messageElement.textContent = 'Chưa lấy được từ mới. Kiểm tra kết nối rồi thử lại.';
    });
  }
}
