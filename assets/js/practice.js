(function (root, factory) {
  root.Practice = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);

  const normalizeReading = value => value
    .normalize('NFKC')
    .replace(/[\s\u0085\u00a0~?。・.]/gu, '');

  function isValidReading(value) {
    const normalized = normalizeReading(value);
    return normalized.length > 0 && /^[ぁ-ゖー]+$/u.test(normalized);
  }

  function removeHtmxHeaders(headers) {
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase().startsWith('hx-')) delete headers[name];
    }
  }

  function parseJson(text, message) {
    try { return JSON.parse(text); }
    catch { throw new Error(message); }
  }

  function parseRandomResponse(text) {
    const sample = parseJson(text, 'API lấy từ trả về dữ liệu không hợp lệ.')?.data;
    if (!sample || typeof sample.kanji !== 'string' || !sample.kanji.trim() ||
        typeof sample.read !== 'string' || !sample.read.trim()) {
      throw new Error('API lấy từ trả về dữ liệu không hợp lệ.');
    }
    return { kanji: sample.kanji, read: sample.read };
  }

  function parseCheckResponse(text) {
    const payload = parseJson(text, 'API kiểm tra trả về dữ liệu không hợp lệ.');
    const correct = typeof payload?.correct === 'boolean'
      ? payload.correct
      : payload?.data?.correct;
    if (typeof correct !== 'boolean') throw new Error('API kiểm tra trả về dữ liệu không hợp lệ.');
    return correct;
  }

  function startRound(sample, type) {
    return { sample: { ...sample, type }, attempts: 0, status: 'active', feedback: '' };
  }

  function validationError(state) {
    return { ...state, feedback: 'Hãy nhập cách đọc bằng Hiragana.' };
  }

  function applyCheckResult(state, correct) {
    if (state.status !== 'active') return state;
    const attempts = state.attempts + 1;
    if (correct) {
      return { ...state, attempts, status: 'correct', feedback: 'Đúng rồi!' };
    }
    if (attempts === 3) {
      return {
        ...state,
        attempts,
        status: 'awaiting-reveal',
        feedback: 'Bạn đã trả lời sai 3 lần.',
      };
    }
    return {
      ...state,
      attempts,
      feedback: `Chưa đúng rồi. Bạn còn ${3 - attempts} lần thử.`,
    };
  }

  function revealAnswer(state) {
    return state.status === 'awaiting-reveal'
      ? { ...state, status: 'revealed', feedback: 'Cùng ghi nhớ cách đọc này nhé.' }
      : state;
  }

  function renderContinueButton() {
    return '<div class="round-actions"><button id="continue" class="primary" type="button"><span>Tiếp tục</span><span>→</span></button></div>';
  }

  function renderRound(state) {
    const correct = state.status === 'correct';
    const showAnswer = correct || state.status === 'revealed';
    let action;
    if (state.status === 'active') {
      action = '<form class="answer-form" id="answer-form"><label for="reading">Cách đọc của bạn</label><input id="reading" name="input" placeholder="Nhập Hiragana, ví dụ: かきます" autocomplete="off" required maxlength="100"><button class="primary" type="submit">Kiểm tra <span>↵</span></button></form>';
    } else if (state.status === 'awaiting-reveal') {
      action = '<div class="round-actions"><button id="reveal-answer" class="primary" type="button"><span>Hiển thị đáp án</span><span>→</span></button></div>';
    } else {
      action = renderContinueButton();
    }

    return `<div class="round-top"><span>CÁCH ĐỌC LÀ GÌ?</span><span>${3 - state.attempts}/3 lần thử</span></div>` +
      `<div class="kanji">${escapeHtml(state.sample.kanji)}</div>` +
      '<p class="question-caption">Hãy đọc từ này bằng Hiragana</p>' +
      (state.feedback ? `<div class="feedback ${correct ? 'success' : ''}">${escapeHtml(state.feedback)}</div>` : '') +
      (showAnswer ? `<div class="reveal"><div class="reading">${escapeHtml(state.sample.read)}</div></div>` : '') +
      action;
  }

  return {
    applyCheckResult,
    isValidReading,
    parseCheckResponse,
    parseRandomResponse,
    removeHtmxHeaders,
    renderRound,
    revealAnswer,
    startRound,
    validationError,
  };
});
