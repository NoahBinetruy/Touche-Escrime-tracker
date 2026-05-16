/* ============================================
   EscrimeTracker - Main Application
   Router, utilities, init
   ============================================ */

const App = (() => {
  let currentPage = 'dashboard';
  let currentSubpage = null;
  let currentId = null;

  // ========== UTILITIES ==========
  function parseDate(iso) {
    if (!iso) return null;
    // Handle YYYY-MM-DD format (add noon time to avoid timezone issues)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(iso + 'T12:00:00');
    return new Date(iso);
  }
  function formatDate(iso) {
    const d = parseDate(iso);
    if (!d || isNaN(d)) return iso || '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function formatDateShort(iso) {
    const d = parseDate(iso);
    if (!d || isNaN(d)) return iso || '';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function toInputDate(iso) {
    if (!iso) return new Date().toISOString().split('T')[0];
    return iso.split('T')[0];
  }
  function weaponLabel(w) {
    return { foil: 'Fleuret', epee: 'Épée', sabre: 'Sabre' }[w] || w;
  }
  function weaponClass(w) {
    return { foil: 'foil', epee: 'epee', sabre: 'sabre' }[w] || '';
  }
  function levelLabel(l) {
    return { local: 'Local', regional: 'Régional', national: 'National', international: 'International' }[l] || l;
  }
  function boutTypeLabel(t) {
    return { pool: 'Poule', de: 'Tableau', training: 'Entraînement' }[t] || t;
  }
  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function extractYoutubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function placementBadge(p) {
    if (!p) return '';
    let cls = 'other';
    if (p === 1) cls = 'gold';
    else if (p === 2) cls = 'silver';
    else if (p === 3) cls = 'bronze';
    return `<span class="placement-badge ${cls}">${p}</span>`;
  }

  // ========== TOAST ==========
  function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
  }

  // ========== CONFIRM ==========
  function confirm(msg) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('confirm-overlay');
      document.getElementById('confirm-message').textContent = msg;
      overlay.classList.remove('hidden');
      const ok = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      function cleanup() { overlay.classList.add('hidden'); ok.replaceWith(ok.cloneNode(true)); cancel.replaceWith(cancel.cloneNode(true)); }
      document.getElementById('confirm-ok').addEventListener('click', () => { cleanup(); resolve(true); });
      document.getElementById('confirm-cancel').addEventListener('click', () => { cleanup(); resolve(false); });
    });
  }

  // ========== MODAL ==========
  function openModal(title, bodyHtml, onAfterRender) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.remove('hidden');
    if (onAfterRender) onAfterRender();
  }
  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  // ========== HEADER ==========
  function setHeader(title, showBack, onBack) {
    document.getElementById('header-title').textContent = title;
    const backBtn = document.getElementById('header-back-btn');
    if (showBack) {
      backBtn.classList.remove('hidden');
      backBtn.onclick = onBack || (() => history.back());
    } else {
      backBtn.classList.add('hidden');
      backBtn.onclick = null;
    }
  }

  // ========== NAVIGATION ==========
  function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  }

  // ========== ROUTER ==========
  function parseHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    return { page: parts[0], sub: parts[1] || null, id: parts[2] || parts[1] || null };
  }

  async function navigate() {
    const { page, sub, id } = parseHash();
    currentPage = page;
    currentSubpage = sub;
    currentId = id;

    const content = document.getElementById('app-content');
    content.innerHTML = '<div class="page" style="text-align:center;padding-top:40px;"><div class="stat-card" style="display:inline-block;padding:20px;"><span style="color:var(--text-muted)">Chargement...</span></div></div>';

    setActiveNav(page);

    try {
      switch (page) {
        case 'dashboard': await Pages.dashboard(content); break;
        case 'lessons':
          if (sub === 'new') await Pages.lessonForm(content);
          else if (sub === 'edit') await Pages.lessonForm(content, id);
          else if (sub === 'view') await Pages.lessonDetail(content, id);
          else await Pages.lessonsList(content);
          break;
        case 'competitions':
          if (sub === 'new') await Pages.competitionForm(content);
          else if (sub === 'edit') await Pages.competitionForm(content, id);
          else if (sub === 'view') await Pages.competitionDetail(content, id);
          else if (sub === 'bout-new') await Pages.boutForm(content, id);
          else if (sub === 'bout-edit') await Pages.boutForm(content, id, parseHash().page);
          else await Pages.competitionsList(content);
          break;
        case 'opponents':
          if (sub === 'new') await Pages.opponentForm(content);
          else if (sub === 'edit') await Pages.opponentForm(content, id);
          else if (sub === 'view') await Pages.opponentDetail(content, id);
          else await Pages.opponentsList(content);
          break;
        case 'stats': await Pages.stats(content); break;
        case 'settings': await Pages.settings(content); break;
        default: await Pages.dashboard(content);
      }
    } catch (err) {
      console.error('Navigation error:', err);
      content.innerHTML = `<div class="page"><div class="empty-state"><h3>Erreur</h3><p>${escapeHtml(err.message)}</p></div></div>`;
    }
  }

  // ========== INIT ==========
  async function init() {
    await DB.open();
    window.addEventListener('hashchange', navigate);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });
    await navigate();
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    navigate, toast, confirm, openModal, closeModal, setHeader, setActiveNav,
    formatDate, formatDateShort, toInputDate, weaponLabel, weaponClass,
    levelLabel, boutTypeLabel, truncate, escapeHtml, extractYoutubeId, placementBadge,
    parseDate
  };
})();
