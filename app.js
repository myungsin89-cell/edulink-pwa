// ── 출판사 데이터 ──────────────────────────────────────────────────
const PUBLISHERS = [
  { id: '',         name: '-- 출판사 선택 --',          url: '' },
  { id: 'tsherpa',  name: '천재교과서 (티셀파)',         url: 'https://text.tsherpa.co.kr/ele/index.html' },
  { id: 'mirae',    name: '미래엔 교과서',               url: 'https://textbook.mirae-n.com/textbook/textBookList.mrn?educationlevelcode=01' },
  { id: 'vivasam',  name: '비상교육 (비바샘)',           url: 'https://e.vivasam.com/main' },
  { id: 'douclass', name: '동아출판 (두클래스 초등)',     url: 'https://ele.douclass.com' },
  { id: 'ybm',      name: 'YBM (와이클라우드)',          url: 'https://www.ybmcloud.com/main.html?siteType=E' },
  { id: 'kumsung',  name: '금성출판사 (티칭허브 초등)',   url: 'https://thub.kumsung.co.kr/elementary/main.do' },
  { id: 'jihak',    name: '지학사 (티솔루션)',            url: 'https://tsol.jihak.co.kr/main.ez' },
  { id: 'iscream',  name: '아이스크림 교과서',            url: 'https://text.i-scream.co.kr' },
  { id: 'custom',   name: '직접 입력',                   url: '' },
];

// ── 기본 과목 ───────────────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  { id: 'korean',    name: '국어',  color: '#E53935', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'math',      name: '수학',  color: '#1565C0', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'social',    name: '사회',  color: '#2E7D32', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'science',   name: '과학',  color: '#6A1B9A', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'english',   name: '영어',  color: '#E65100', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'moral',     name: '도덕',  color: '#00838F', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'pe',        name: '체육',  color: '#4E342E', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'music',     name: '음악',  color: '#AD1457', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'art',       name: '미술',  color: '#BF360C', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'practical', name: '실과',  color: '#00695C', visible: false, publisherId: '', url: '', siteName: '' },
];

// ── Storage ────────────────────────────────────────────────────────
const store = {
  _get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  getSubjects() { return this._get('el_subjects', DEFAULT_SUBJECTS); },
  saveSubjects(s) { return this._set('el_subjects', s); },
  isFirstVisit() { return !localStorage.getItem('el_visited'); },
  markVisited() { localStorage.setItem('el_visited', '1'); },
  isInstallDismissed() { return !!localStorage.getItem('el_install_dismissed'); },
  dismissInstall() { localStorage.setItem('el_install_dismissed', '1'); },
};

// ── Utils ──────────────────────────────────────────────────────────
function isValidUrl(str) {
  if (!str) return false;
  try { const u = new URL(str); return u.protocol === 'https:' || u.protocol === 'http:'; }
  catch { return false; }
}

function autoPrefix(str) {
  str = str.trim();
  if (str && !/^https?:\/\//i.test(str)) str = 'https://' + str;
  return str;
}

function shortenUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

// ── Toast ──────────────────────────────────────────────────────────
let toastEl = null, toastTimer = null;

function showToast(msg, duration = 2200) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ── Modal ──────────────────────────────────────────────────────────
function showModal({ title, message, confirmText = '확인', cancelText = '취소', onConfirm, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');

  const h3 = document.createElement('h3'); h3.textContent = title;
  const p = document.createElement('p');   p.textContent = message;
  const actions = document.createElement('div'); actions.className = 'modal-actions';

  if (cancelText) {
    const c = document.createElement('button'); c.className = 'modal-cancel'; c.textContent = cancelText;
    actions.appendChild(c);
  }
  const ok = document.createElement('button'); ok.className = 'modal-confirm'; ok.textContent = confirmText;
  actions.appendChild(ok);
  box.append(h3, p, actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  ok.addEventListener('click', () => { close(); onConfirm?.(); });
  overlay.querySelector('.modal-cancel')?.addEventListener('click', () => { close(); onCancel?.(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) { close(); onCancel?.(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); onCancel?.(); } }, { once: true });
}

// ── PWA Install ────────────────────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (currentView === 'main') navigate('main');
});

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
}

// ── Router ─────────────────────────────────────────────────────────
let currentView = 'main';

function navigate(view) {
  currentView = view;
  const main = document.querySelector('main');
  main.innerHTML = '';
  if (view === 'main') renderMain(main);
  else renderSettings(main);
  updateHeader(view);
  window.scrollTo(0, 0);
}

function updateHeader(view) {
  document.querySelector('header h1').textContent =
    view === 'main' ? '교과서 바로가기' : '과목 설정';
  const btn = document.getElementById('header-settings-btn');
  btn.textContent = view === 'main' ? '설정' : '홈';
  btn.title = view === 'main' ? '설정' : '홈으로';
  btn.onclick = () => navigate(view === 'main' ? 'settings' : 'main');
}

// ── Main View ──────────────────────────────────────────────────────
function renderMain(container) {
  const subjects = store.getSubjects();
  const visible = subjects.filter(s => s.visible && s.url);

  let html = '';

  // PWA 설치 배너 (Android/Chrome)
  if (!isStandalone() && !store.isInstallDismissed() && deferredPrompt) {
    html += `<div class="install-banner" id="install-banner">
      <p>바탕화면에 앱으로 설치하면 더 빠르게 열 수 있어요!</p>
      <button class="install-btn" id="install-btn">설치</button>
      <button class="dismiss-btn" id="dismiss-btn">✕</button>
    </div>`;
  }

  // iOS 설치 안내
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && !isStandalone() && !store.isInstallDismissed()) {
    html += `<div class="install-banner" id="install-banner">
      <p>Safari → <strong>공유 버튼 → 홈 화면에 추가</strong>로 설치하세요!</p>
      <button class="dismiss-btn" id="dismiss-btn">✕</button>
    </div>`;
  }

  // 최초 방문 팁
  if (store.isFirstVisit()) {
    html += `<div class="tip-box" id="tip-box">
      <span>처음에는 아래 <strong>과목 설정</strong> 카드를 눌러 과목과 출판사 사이트를 연결하세요!</span>
      <button class="tip-close" id="tip-close">✕</button>
    </div>`;
    store.markVisited();
  }

  if (visible.length === 0) {
    html += `<div class="empty-state">
      <h2>아직 연결된 과목이 없어요</h2>
      <p>아래 버튼을 눌러 과목별 출판사 사이트를 연결하면<br>여기에 바로가기 카드가 나타납니다.</p>
      <button class="empty-cta" id="empty-setup-btn">과목 설정하기</button>
    </div>`;
  } else {
    html += `<p class="section-label">과목을 눌러서 사이트 열기</p>`;
    html += `<div class="subject-grid">`;
    for (const s of visible) {
      html += `<a class="subject-btn"
        style="--btn-color:${s.color}"
        href="${s.url}" target="_blank" rel="noopener noreferrer"
        aria-label="${s.name} - ${s.siteName || shortenUrl(s.url)} 열기">
        <span class="subject-name">${s.name}</span>
        <span class="subject-site">${s.siteName || shortenUrl(s.url)}</span>
      </a>`;
    }
    html += `<button class="settings-card" id="open-settings-card">
      <span class="sc-label">과목<br>설정</span>
    </button>`;
    html += `</div>`;
  }

  container.innerHTML = html;

  // 이벤트 바인딩
  document.getElementById('empty-setup-btn')?.addEventListener('click', () => navigate('settings'));
  document.getElementById('open-settings-card')?.addEventListener('click', () => navigate('settings'));

  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { showToast('앱이 설치되었습니다!'); deferredPrompt = null; }
    document.getElementById('install-banner')?.remove();
  });
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    store.dismissInstall();
    document.getElementById('install-banner')?.remove();
  });
  document.getElementById('tip-close')?.addEventListener('click', () => {
    document.getElementById('tip-box')?.remove();
  });
}

// ── Settings View ──────────────────────────────────────────────────
function renderSettings(container) {
  const subjects = store.getSubjects();

  let html = `<div class="settings-section">
    <p class="section-header">과목별 출판사 연결 &amp; 표시 설정</p>`;

  for (const s of subjects) {
    const pub = PUBLISHERS.find(p => p.id === s.publisherId) || PUBLISHERS[0];
    const hasUrl = !!s.url;
    const isCustom = s.publisherId === 'custom';
    const visActive = hasUrl;
    const color = s.color || '#607D8B';

    const options = PUBLISHERS.map(p =>
      `<option value="${p.id}" ${p.id === s.publisherId ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    html += `<div class="setting-row" data-id="${s.id}">
      <div class="row-top">
        <label class="color-swatch" style="background:${color}" title="색상 변경">
          <input type="color" class="color-input" value="${color}" />
        </label>
        <span class="row-name">${s.name}</span>
        <select class="pub-select">${options}</select>
        <button class="vis-btn ${visActive ? 'active' : ''}"
          ${!hasUrl ? 'disabled' : ''}
          title="${visActive ? '메인에 표시 중 (클릭하면 숨김)' : '메인에 미표시 (클릭하면 표시)'}">
          ${visActive ? '표시' : '숨김'}
        </button>
        <button class="del-btn" title="과목 삭제">삭제</button>
      </div>
      <div class="row-url ${!s.publisherId ? 'hidden' : ''}">
        <input type="url" class="url-input"
          value="${s.url}"
          placeholder="https://"
          ${hasUrl && !isCustom ? 'readonly' : ''}/>
        ${hasUrl ? `<a class="open-link" href="${s.url}" target="_blank" rel="noopener noreferrer">열기</a>` : ''}
      </div>
    </div>`;
  }

  html += `</div>`;

  html += `<div class="settings-section add-box">
    <p class="section-header" style="margin-bottom:10px">과목 추가</p>
    <div class="add-row">
      <input type="text" class="add-input" id="new-name" placeholder="예: 창체, 안전" maxlength="10"/>
      <button class="add-btn" id="add-btn">추가</button>
    </div>
  </div>`;

  html += `<div class="settings-actions">
    <button class="btn-cancel" id="cancel-btn">취소</button>
    <button class="btn-save" id="save-btn">저장하기</button>
  </div>`;

  container.innerHTML = html;

  // ── 이벤트: 색상 변경 실시간 반영 ──
  container.querySelectorAll('.color-input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.color-swatch').style.background = input.value;
    });
  });

  // ── 이벤트: 출판사 드롭다운 ──
  container.querySelectorAll('.pub-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const row = sel.closest('.setting-row');
      const urlInput = row.querySelector('.url-input');
      const urlRow = row.querySelector('.row-url');
      const visBtn = row.querySelector('.vis-btn');
      const openLink = row.querySelector('.open-link');
      const p = PUBLISHERS.find(p => p.id === sel.value);

      if (!p || !p.id) {
        urlRow.classList.add('hidden');
        urlInput.value = '';
        visBtn.disabled = true;
        visBtn.classList.remove('active');
        visBtn.textContent = '숨김';
        visBtn.title = '메인에 미표시 (클릭하면 표시)';
        return;
      }
      urlRow.classList.remove('hidden');
      if (p.id === 'custom') {
        urlInput.removeAttribute('readonly');
        urlInput.value = '';
        urlInput.focus();
        if (openLink) openLink.remove();
        visBtn.disabled = true;
        visBtn.classList.remove('active');
        visBtn.textContent = '숨김';
        visBtn.title = '메인에 미표시 (클릭하면 표시)';
      } else {
        urlInput.setAttribute('readonly', '');
        urlInput.value = p.url;
        if (openLink) { openLink.href = p.url; }
        else {
          const a = document.createElement('a');
          a.className = 'open-link';
          a.href = p.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = '열기';
          urlRow.appendChild(a);
        }
        // 출판사 선택 시 자동으로 표시 활성화 (버그 수정)
        visBtn.disabled = false;
        visBtn.classList.add('active');
        visBtn.textContent = '표시';
        visBtn.title = '메인에 표시 중 (클릭하면 숨김)';
      }
    });
  });

  // ── 이벤트: 직접 URL 입력 시 열기 링크 갱신 ──
  container.querySelectorAll('.url-input').forEach(input => {
    input.addEventListener('input', () => {
      const row = input.closest('.setting-row');
      const visBtn = row.querySelector('.vis-btn');
      const urlRow = row.querySelector('.row-url');
      const url = autoPrefix(input.value);
      let openLink = row.querySelector('.open-link');

      if (isValidUrl(url)) {
        visBtn.disabled = false;
        // 유효한 URL 입력 시 자동으로 표시 활성화 (버그 수정)
        if (!visBtn.classList.contains('active')) {
          visBtn.classList.add('active');
          visBtn.textContent = '표시';
          visBtn.title = '메인에 표시 중 (클릭하면 숨김)';
        }
        if (!openLink) {
          openLink = document.createElement('a');
          openLink.className = 'open-link';
          openLink.target = '_blank';
          openLink.rel = 'noopener noreferrer';
          openLink.textContent = '열기';
          urlRow.appendChild(openLink);
        }
        openLink.href = url;
      } else {
        visBtn.disabled = true;
        visBtn.classList.remove('active');
        visBtn.textContent = '숨김';
        visBtn.title = '메인에 미표시 (클릭하면 표시)';
        openLink?.remove();
      }
    });
  });

  // ── 이벤트: 표시/숨김 토글 ──
  container.querySelectorAll('.vis-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const isActive = btn.classList.toggle('active');
      btn.textContent = isActive ? '표시' : '숨김';
      btn.title = isActive ? '메인에 표시 중 (클릭하면 숨김)' : '메인에 미표시 (클릭하면 표시)';
    });
  });

  // ── 이벤트: 과목 삭제 ──
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.setting-row');
      const id = row.dataset.id;
      const subjects = store.getSubjects();
      const subject = subjects.find(s => s.id === id);
      showModal({
        title: `"${subject?.name}" 삭제`,
        message: '이 과목을 목록에서 삭제합니다.',
        confirmText: '삭제',
        onConfirm: () => {
          store.saveSubjects(subjects.filter(s => s.id !== id));
          showToast(`"${subject?.name}" 과목이 삭제되었습니다.`);
          navigate('settings');
        },
      });
    });
  });

  // ── 이벤트: 과목 추가 ──
  document.getElementById('add-btn').addEventListener('click', () => {
    const input = document.getElementById('new-name');
    const name = input.value.trim();
    if (!name) { showToast('과목 이름을 입력해주세요.'); input.focus(); return; }
    const subjects = store.getSubjects();
    if (subjects.length >= 24) { showToast('최대 24개 과목까지 추가할 수 있습니다.'); return; }
    if (subjects.some(s => s.name === name)) { showToast('같은 이름의 과목이 이미 있습니다.'); return; }
    subjects.push({
      id: 'custom_' + Date.now(), name,
      color: '#607D8B',
      visible: false, publisherId: '', url: '', siteName: '',
    });
    store.saveSubjects(subjects);
    showToast(`"${name}" 과목이 추가되었습니다.`);
    navigate('settings');
  });

  // ── 이벤트: 취소 ──
  document.getElementById('cancel-btn').addEventListener('click', () => navigate('main'));

  // ── 이벤트: 저장 ──
  document.getElementById('save-btn').addEventListener('click', () => {
    let hasError = false;

    container.querySelectorAll('.setting-row').forEach(row => {
      const id = row.dataset.id;
      const s = subjects.find(s => s.id === id);
      if (!s) return;

      const publisherId = row.querySelector('.pub-select').value;
      const urlInput = row.querySelector('.url-input');
      const visBtn = row.querySelector('.vis-btn');
      const colorInput = row.querySelector('.color-input');
      let url = autoPrefix(urlInput?.value || '');
      const pub = PUBLISHERS.find(p => p.id === publisherId);

      if (publisherId && url && !isValidUrl(url)) {
        urlInput.style.borderColor = 'var(--danger)';
        showToast('올바르지 않은 주소가 있습니다.');
        hasError = true;
        return;
      }
      urlInput.style.borderColor = '';

      s.publisherId = publisherId;
      s.url = (publisherId && url) ? url : '';
      s.siteName = (pub && pub.id !== 'custom' && pub.id !== '') ? pub.name : '';
      s.visible = visBtn.classList.contains('active') && !!s.url;
      if (colorInput) s.color = colorInput.value;
    });

    if (hasError) return;
    store.saveSubjects(subjects);
    showToast('저장되었습니다!');
    setTimeout(() => navigate('main'), 500);
  });
}

// ── Init ───────────────────────────────────────────────────────────
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service Worker 등록 실패:', err);
    });
  }
  navigate('main');
}

document.addEventListener('DOMContentLoaded', init);
