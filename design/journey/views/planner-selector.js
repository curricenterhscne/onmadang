/* ============================================================
   views/planner-selector.js — #/planner/selector
   4단계 과목 선택 실습을 iframe으로 여정 안에 임베드.
   selector가 exportToJSON 시 localStorage에 결과를 남기므로
   storage 이벤트로 감지하여 이력카드로 유도.
   ============================================================ */

const SELECTOR_CACHE_KEY = 'onmadang.jinro.selector';

export async function render(view, ctx) {
  view.classList.add('j-view-embed');

  view.innerHTML = `
    <section class="j-embed" aria-labelledby="emb-h">
      <header class="j-embed-head">
        <div class="j-embed-title">
          <h1 id="emb-h">4단계 · 과목 선택 실습</h1>
          <p class="j-hint">실습에서 <b>[저장 → JSON]</b>을 누르면 결과가 자동으로 5단계 이력카드에 반영됩니다. 실습 결과가 저장되면 아래 배너가 나타납니다.</p>
        </div>
        <div class="j-embed-actions">
          <a class="j-btn" href="../selector/" target="_blank" rel="noopener">새 창으로 열기 ↗</a>
          <a class="j-btn j-btn-primary" href="#/report/courses">이력카드로 이동 →</a>
        </div>
      </header>

      <div id="save-detected" class="j-embed-detected" hidden role="status" aria-live="polite">
        <b>✓ 실습 결과가 저장되었습니다.</b>
        <a class="j-btn j-btn-primary" href="#/report/courses">지금 이력카드 보기 →</a>
      </div>

      <div class="j-embed-frame-wrap">
        <iframe id="selector-iframe" class="j-embed-frame"
          src="../selector/?embed=1"
          title="과목 선택 실습"
          loading="lazy"
          allow="fullscreen"></iframe>
      </div>

      <footer class="j-embed-foot">
        <p class="j-hint">
          실습 도구가 <b>새 창에서 더 편하게</b> 보인다면 위의 [새 창으로 열기]를 사용하세요.
          두 방식 모두 저장 결과는 자동으로 여정에 반영됩니다.
        </p>
      </footer>
    </section>

    <nav class="j-nav">
      <a href="#/career/roadmap" class="j-btn">← 진로 로드맵</a>
      <a href="#/report/courses" class="j-btn j-btn-primary">다음: 이력카드 →</a>
    </nav>
  `;

  // storage 이벤트 — 새 창/iframe/현재 창 어디서 저장하든 감지
  const detected = view.querySelector('#save-detected');
  const showDetected = () => {
    detected.hidden = false;
    detected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const handler = (e) => {
    if (e.key === SELECTOR_CACHE_KEY && e.newValue) showDetected();
  };
  window.addEventListener('storage', handler);

  // iframe 로드 후 localStorage 확인 (같은 창 내부 이벤트는 storage로 안 옴)
  // — 폴링 최소한: 3초마다 확인, 5분 후 종료
  let stopPolling = false;
  const startedAt = Date.now();
  const initialCache = (() => {
    try { return localStorage.getItem(SELECTOR_CACHE_KEY); } catch { return null; }
  })();
  let lastSeen = initialCache;
  const poll = () => {
    if (stopPolling) return;
    if (Date.now() - startedAt > 5 * 60 * 1000) return; // 5분 후 정지
    try {
      const cur = localStorage.getItem(SELECTOR_CACHE_KEY);
      if (cur && cur !== lastSeen) {
        lastSeen = cur;
        showDetected();
      }
    } catch { /* 무시 */ }
    setTimeout(poll, 3000);
  };
  setTimeout(poll, 3000);

  // 뷰 재진입/전환 시 정리 훅 — hashchange로 라우팅되므로 다음 라우트 진입 시 새 이벤트 리스너로 갈아탐
  window.addEventListener('hashchange', function once() {
    stopPolling = true;
    window.removeEventListener('storage', handler);
    window.removeEventListener('hashchange', once);
  });
}
