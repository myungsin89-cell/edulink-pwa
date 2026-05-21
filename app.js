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
  { id: 'korean',    name: '국어',  icon: '✏️', color: '#E53935', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'math',      name: '수학',  icon: '🔢', color: '#1565C0', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'social',    name: '사회',  icon: '🌏', color: '#2E7D32', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'science',   name: '과학',  icon: '🔬', color: '#6A1B9A', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'english',   name: '영어',  icon: '🔤', color: '#E65100', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'moral',     name: '도덕',  icon: '💚', color: '#00838F', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'pe',        name: '체육',  icon: '⚽', color: '#4E342E', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'music',     name: '음악',  icon: '🎵', color: '#AD1457', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'art',       name: '미술',  icon: '🎨', color: '#BF360C', visible: false, publisherId: '', url: '', siteName: '' },
  { id: 'practical', name: '실과',  icon: '🛠️', color: '#00695C', visible: false, publisherId: '', url: '', siteName: '' },
];

// ── Storage ────────────────────────────────────────────────────────
const store = {
  _get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (err) {
      console.warn('localStorage 읽기 실패:', err);
      return fallback;
    }
  },
  _set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (err) {
      console.warn('localStorage 저장 실패:', err);
      return false;
    }
  },
  _getRaw(key) {
    try { return localStorage.getItem(key); }
    catch (err) { console.warn('localStorage 읽기 실패:', err); return null; }
  },
  _setRaw(key, val) {
    try { localStorage.setItem(key, val); return true; }
    catch (err) { console.warn('localStorage 저장 실패:', err); return false; }
  },
  getSubjects() { return normalizeSubjects(this._get('el_subjects', DEFAULT_SUBJECTS)); },
  saveSubjects(s) { return this._set('el_subjects', normalizeSubjects(s)); },
  isFirstVisit() { return !this._getRaw('el_visited'); },
  markVisited() { return this._setRaw('el_visited', '1'); },
  isInstallDismissed() { return !!this._getRaw('el_install_dismissed'); },
  dismissInstall() { return this._setRaw('el_install_dismissed', '1'); },
};

// ── Utils ──────────────────────────────────────────────────────────
function isValidUrl(str) {
  if (!str) return false;
  try { const u = new URL(str); return u.protocol === 'https:'; }
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[ch]));
}

function sanitizeColor(value, fallback = '#607D8B') {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function getSubjectIcon(subject) {
  const savedIcon = String(subject?.icon || '').trim();
  if (savedIcon) return savedIcon;
  const byId = DEFAULT_SUBJECTS.find(item => item.id === subject?.id);
  if (byId?.icon) return byId.icon;
  const byName = DEFAULT_SUBJECTS.find(item => item.name === subject?.name);
  return byName?.icon || '📘';
}

function cloneSubjects(subjects) {
  return subjects.map(s => ({ ...s }));
}

function normalizeSubjects(subjects) {
  const source = Array.isArray(subjects) ? subjects : DEFAULT_SUBJECTS;
  return source.map((s, idx) => {
    const url = String(s?.url || '').trim();
    const validUrl = isValidUrl(url) ? url : '';
    return {
      id: String(s?.id || `subject_${idx}`),
      name: String(s?.name || '과목'),
      icon: getSubjectIcon(s),
      color: sanitizeColor(s?.color),
      visible: !!s?.visible && !!validUrl,
      publisherId: String(s?.publisherId || ''),
      url: validUrl,
      siteName: String(s?.siteName || ''),
    };
  });
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
  const header = document.querySelector('header');
  header.classList.toggle('main-header-hidden', view === 'main');
  document.querySelector('header h1').textContent =
    view === 'main' ? '' : '과목 설정';
  const btn = document.getElementById('header-settings-btn');
  btn.textContent = '홈';
  btn.title = '홈으로';
  btn.setAttribute('aria-label', '홈으로');
  btn.onclick = () => navigate('main');
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
      <span>처음에는 <strong>과목 설정</strong>에서 과목과 출판사 사이트를 연결하세요!</span>
      <button class="tip-close" id="tip-close">✕</button>
    </div>`;
    if (!store.markVisited()) showToast('방문 기록을 저장하지 못했습니다.');
  }

  const statusText = visible.length > 0
    ? `${visible.length}개 과목 바로가기 준비됨 · 카드를 눌러 수정`
    : '카드를 눌러 과목을 설정하세요';

  html += `<section class="hero-card" id="hero-settings-card" role="button" tabindex="0" aria-labelledby="hero-title" aria-label="과목 설정 열기">
    <div class="hero-icon" aria-hidden="true">📚</div>
    <h2 id="hero-title">교과서 바로가기</h2>
    <p class="hero-status">${escapeHtml(statusText)}</p>
  </section>`;

  if (visible.length === 0) {
    html += `<div class="empty-state">
      <h2>아직 연결된 과목이 없어요</h2>
      <p>과목별 출판사를 한 번만 연결하면<br>메인 화면에 바로가기 카드가 나타납니다.</p>
    </div>`;
  } else {
    html += `<p class="section-label">과목을 눌러서 사이트 열기</p>`;
    html += `<div class="subject-grid">`;
    for (const s of visible) {
      const safeColor = sanitizeColor(s.color);
      const safeUrl = isValidUrl(s.url) ? s.url : '';
      const siteLabel = s.siteName || shortenUrl(safeUrl);
      html += `<a class="subject-btn"
        style="--btn-color:${escapeHtml(safeColor)}"
        href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer"
        aria-label="${escapeHtml(`${s.name} - ${siteLabel} 열기`)}">
        <span class="subject-icon" aria-hidden="true">${escapeHtml(s.icon)}</span>
        <span class="subject-name">${escapeHtml(s.name)}</span>
        <span class="subject-site">${escapeHtml(siteLabel)}</span>
      </a>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  // 이벤트 바인딩
  const heroSettingsCard = document.getElementById('hero-settings-card');
  heroSettingsCard?.addEventListener('click', () => navigate('settings'));
  heroSettingsCard?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('settings');
    }
  });

  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { showToast('앱이 설치되었습니다!'); deferredPrompt = null; }
    document.getElementById('install-banner')?.remove();
  });
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    if (!store.dismissInstall()) showToast('설치 안내 상태를 저장하지 못했습니다.');
    document.getElementById('install-banner')?.remove();
  });
  document.getElementById('tip-close')?.addEventListener('click', () => {
    document.getElementById('tip-box')?.remove();
  });
}

// ── Settings View ──────────────────────────────────────────────────
function renderSettings(container, draftSubjects = null) {
  const subjects = draftSubjects ? cloneSubjects(draftSubjects) : cloneSubjects(store.getSubjects());

  let html = `<div class="settings-section">
    <p class="section-header">과목별 출판사 연결 &amp; 표시 설정</p>`;

  for (const s of subjects) {
    const hasUrl = isValidUrl(s.url);
    const isCustom = s.publisherId === 'custom';
    const visActive = !!s.visible && hasUrl;
    const color = sanitizeColor(s.color);
    const safeUrl = hasUrl ? s.url : '';

    const options = PUBLISHERS.map(p =>
      `<option value="${escapeHtml(p.id)}" ${p.id === s.publisherId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');

    html += `<div class="setting-row" data-id="${escapeHtml(s.id)}">
      <div class="row-top">
        <label class="color-swatch" style="background:${escapeHtml(color)}" title="색상 변경">
          <input type="color" class="color-input" value="${escapeHtml(color)}" />
        </label>
        <span class="row-name">${escapeHtml(s.name)}</span>
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
          value="${escapeHtml(s.url)}"
          placeholder="https://"
          ${hasUrl && !isCustom ? 'readonly' : ''}/>
        ${hasUrl ? `<a class="open-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">열기</a>` : ''}
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

  function setVisButton(btn, active, disabled = false) {
    btn.disabled = disabled;
    btn.classList.toggle('active', !!active && !disabled);
    const isActive = btn.classList.contains('active');
    btn.textContent = isActive ? '표시' : '숨김';
    btn.title = isActive ? '메인에 표시 중 (클릭하면 숨김)' : '메인에 미표시 (클릭하면 표시)';
  }

  function updateOpenLink(row, url) {
    const urlRow = row.querySelector('.row-url');
    let openLink = row.querySelector('.open-link');
    if (!isValidUrl(url)) {
      openLink?.remove();
      return;
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
  }

  function collectDraftFromRows(showErrors = false) {
    let hasError = false;
    container.querySelectorAll('.setting-row').forEach(row => {
      const id = row.dataset.id;
      const s = subjects.find(item => item.id === id);
      if (!s) return;

      const publisherId = row.querySelector('.pub-select').value;
      const urlInput = row.querySelector('.url-input');
      const visBtn = row.querySelector('.vis-btn');
      const colorInput = row.querySelector('.color-input');
      const pub = PUBLISHERS.find(p => p.id === publisherId);
      const url = publisherId ? autoPrefix(urlInput?.value || '') : '';
      const invalidUrl = !!(publisherId && url && !isValidUrl(url));

      if (invalidUrl) {
        if (showErrors) {
          urlInput.style.borderColor = 'var(--danger)';
          showToast('https://로 시작하는 올바른 주소만 사용할 수 있습니다.');
        }
        hasError = true;
      } else if (urlInput) {
        urlInput.style.borderColor = '';
      }

      s.publisherId = publisherId;
      s.url = url;
      s.siteName = (pub && pub.id !== 'custom' && pub.id !== '') ? pub.name : '';
      s.visible = visBtn.classList.contains('active') && isValidUrl(url);
      if (colorInput) s.color = sanitizeColor(colorInput.value);
    });
    return !hasError;
  }

  // ── 이벤트: 색상 변경 실시간 반영 ──
  container.querySelectorAll('.color-input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.color-swatch').style.background = sanitizeColor(input.value);
    });
  });

  // ── 이벤트: 출판사 드롭다운 ──
  container.querySelectorAll('.pub-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const row = sel.closest('.setting-row');
      const urlInput = row.querySelector('.url-input');
      const urlRow = row.querySelector('.row-url');
      const visBtn = row.querySelector('.vis-btn');
      const p = PUBLISHERS.find(pub => pub.id === sel.value);
      const wasActive = visBtn.classList.contains('active');
      const hadValidUrl = isValidUrl(autoPrefix(urlInput.value));

      if (!p || !p.id) {
        urlRow.classList.add('hidden');
        urlInput.value = '';
        updateOpenLink(row, '');
        setVisButton(visBtn, false, true);
        return;
      }

      urlRow.classList.remove('hidden');
      if (p.id === 'custom') {
        urlInput.removeAttribute('readonly');
        urlInput.value = '';
        urlInput.focus();
        updateOpenLink(row, '');
        setVisButton(visBtn, false, true);
      } else {
        urlInput.setAttribute('readonly', '');
        urlInput.value = p.url;
        updateOpenLink(row, p.url);
        setVisButton(visBtn, wasActive || !hadValidUrl, false);
      }
    });
  });

  // ── 이벤트: 직접 URL 입력 시 열기 링크 갱신 ──
  container.querySelectorAll('.url-input').forEach(input => {
    input.addEventListener('input', () => {
      const row = input.closest('.setting-row');
      const visBtn = row.querySelector('.vis-btn');
      const url = autoPrefix(input.value);
      const wasActive = visBtn.classList.contains('active');
      const wasDisabled = visBtn.disabled;

      if (isValidUrl(url)) {
        setVisButton(visBtn, wasActive || wasDisabled, false);
        updateOpenLink(row, url);
      } else {
        setVisButton(visBtn, false, true);
        updateOpenLink(row, '');
      }
    });
  });

  // ── 이벤트: 표시/숨김 토글 ──
  container.querySelectorAll('.vis-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setVisButton(btn, !btn.classList.contains('active'), false);
    });
  });

  // ── 이벤트: 과목 삭제 ──
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      collectDraftFromRows(false);
      const row = btn.closest('.setting-row');
      const id = row.dataset.id;
      const subject = subjects.find(s => s.id === id);
      showModal({
        title: `"${subject?.name || '과목'}" 삭제`,
        message: '이 과목을 목록에서 삭제합니다. 저장하기 전까지 실제 저장되지 않습니다.',
        confirmText: '삭제',
        onConfirm: () => {
          const idx = subjects.findIndex(s => s.id === id);
          if (idx >= 0) subjects.splice(idx, 1);
          showToast(`"${subject?.name || '과목'}" 과목이 임시 삭제되었습니다.`);
          renderSettings(container, subjects);
        },
      });
    });
  });

  // ── 이벤트: 과목 추가 ──
  document.getElementById('add-btn').addEventListener('click', () => {
    collectDraftFromRows(false);
    const input = document.getElementById('new-name');
    const name = input.value.trim();
    if (!name) { showToast('과목 이름을 입력해주세요.'); input.focus(); return; }
    if (subjects.length >= 24) { showToast('최대 24개 과목까지 추가할 수 있습니다.'); return; }
    if (subjects.some(s => s.name === name)) { showToast('같은 이름의 과목이 이미 있습니다.'); return; }
    subjects.push({
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      icon: '📘',
      color: '#607D8B',
      visible: false,
      publisherId: '',
      url: '',
      siteName: '',
    });
    showToast(`"${name}" 과목이 임시 추가되었습니다.`);
    renderSettings(container, subjects);
  });

  // ── 이벤트: 취소 ──
  document.getElementById('cancel-btn').addEventListener('click', () => navigate('main'));

  // ── 이벤트: 저장 ──
  document.getElementById('save-btn').addEventListener('click', () => {
    if (!collectDraftFromRows(true)) return;
    if (!store.saveSubjects(subjects)) {
      showToast('저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.', 3500);
      return;
    }
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
