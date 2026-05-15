/* ============================================
   EscrimeTracker - Lessons Pages
   ============================================ */

// ========== LESSONS LIST ==========
Pages.lessonsList = async function(content) {
  App.setHeader('Leçons', false);
  const lessons = (await DB.getLessons()).sort((a,b) => b.date.localeCompare(a.date));
  content.innerHTML = `<div class="page">
    <h2 class="page-title">Carnet de leçons</h2>
    <p class="page-subtitle">${lessons.length} leçon${lessons.length>1?'s':''} enregistrée${lessons.length>1?'s':''}</p>
    <div class="search-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="lesson-search" placeholder="Rechercher une leçon...">
    </div>
    <div class="filter-pills">
      <button class="filter-pill active" data-filter="all">Toutes</button>
      <button class="filter-pill" data-filter="technique">Technique</button>
      <button class="filter-pill" data-filter="tactique">Tactique</button>
      <button class="filter-pill" data-filter="physique">Physique</button>
      <button class="filter-pill" data-filter="mental">Mental</button>
    </div>
    <div id="lessons-list">${_renderLessonCards(lessons)}</div>
    <a href="#lessons/new" class="fab" id="fab-add-lesson">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </a>
  </div>`;
  // Search
  document.getElementById('lesson-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    _filterLessons(lessons, q, activeFilter);
  });
  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const q = document.getElementById('lesson-search').value.toLowerCase();
      _filterLessons(lessons, q, btn.dataset.filter);
    });
  });
};

function _filterLessons(lessons, query, filter) {
  let filtered = lessons;
  if (filter !== 'all') filtered = filtered.filter(l => (l.tags||[]).includes(filter));
  if (query) filtered = filtered.filter(l => l.title.toLowerCase().includes(query) || (l.content||'').toLowerCase().includes(query));
  document.getElementById('lessons-list').innerHTML = _renderLessonCards(filtered);
}

function _renderLessonCards(lessons) {
  if (lessons.length === 0) return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    <h3>Aucune leçon</h3><p>Ajoute ta première leçon pour commencer ton carnet</p></div>`;
  return lessons.map(l => `<div class="card card-clickable" onclick="location.hash='lessons/view/${l.id}'">
    <div class="card-header"><span class="card-title">${App.escapeHtml(l.title)}</span><span class="card-date">${App.formatDateShort(l.date)}</span></div>
    <div class="card-body">${App.truncate(App.escapeHtml(l.content), 100)}</div>
    <div class="card-footer">${(l.tags||[]).map(t => `<span class="tag ${t}">${t}</span>`).join('')}
      ${(l.videoRefs||[]).length > 0 ? `<span class="tag" style="background:rgba(255,77,109,.12);color:var(--accent-secondary)">🎬 ${l.videoRefs.length}</span>` : ''}</div>
  </div>`).join('');
}

// ========== LESSON DETAIL ==========
Pages.lessonDetail = async function(content, id) {
  const lesson = await DB.getLesson(id);
  if (!lesson) { location.hash = 'lessons'; return; }
  App.setHeader('Leçon', true, () => location.hash = 'lessons');

  let videosHtml = '';
  if (lesson.videoRefs && lesson.videoRefs.length > 0) {
    videosHtml = '<div class="detail-section"><div class="detail-label">Vidéos</div>';
    for (const v of lesson.videoRefs) {
      if (v.type === 'youtube') {
        const ytId = App.extractYoutubeId(v.url);
        if (ytId) videosHtml += `<div class="video-player"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>`;
      } else if (v.type === 'local') {
        try {
          const vid = await DB.getVideo(v.videoId);
          if (vid) {
            const url = URL.createObjectURL(vid.blob);
            videosHtml += `<div class="video-player"><video controls preload="metadata" src="${url}"></video></div>`;
          }
        } catch(e) { videosHtml += `<p style="color:var(--text-muted);font-size:.85rem">Vidéo non disponible</p>`; }
      }
    }
    videosHtml += '</div>';
  }

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${App.escapeHtml(lesson.title)}</h2>
    <p class="page-subtitle">${App.formatDate(lesson.date)}</p>
    <div class="card-footer" style="margin-bottom:20px">${(lesson.tags||[]).map(t => `<span class="tag ${t}">${t}</span>`).join('')}</div>
    <div class="detail-section"><div class="detail-label">Notes</div>
      <div class="detail-value" style="white-space:pre-wrap">${App.escapeHtml(lesson.content)}</div>
    </div>
    ${videosHtml}
    <div class="detail-actions">
      <a href="#lessons/edit/${lesson.id}" class="btn btn-primary" style="flex:1">Modifier</a>
      <button class="btn btn-danger" id="delete-lesson-btn" style="flex:1">Supprimer</button>
    </div>
  </div>`;
  document.getElementById('delete-lesson-btn').addEventListener('click', async () => {
    if (await App.confirm('Supprimer cette leçon ?')) {
      if (lesson.videoRefs) for (const v of lesson.videoRefs) { if (v.type === 'local' && v.videoId) await DB.deleteVideo(v.videoId); }
      await DB.deleteLesson(id);
      App.toast('Leçon supprimée');
      location.hash = 'lessons';
    }
  });
};

// ========== LESSON FORM ==========
Pages.lessonForm = async function(content, id) {
  let lesson = { title: '', date: new Date().toISOString(), content: '', tags: [], videoRefs: [] };
  if (id) {
    const existing = await DB.getLesson(id);
    if (existing) lesson = existing;
  }
  const isEdit = !!id;
  App.setHeader(isEdit ? 'Modifier la leçon' : 'Nouvelle leçon', true, () => location.hash = 'lessons');

  // Temp video refs storage
  let tempVideoRefs = [...(lesson.videoRefs || [])];
  let newLocalVideos = []; // {file, tempId}

  function renderVideoList() {
    const el = document.getElementById('video-list');
    if (!el) return;
    if (tempVideoRefs.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = tempVideoRefs.map((v, i) => `<div class="video-item">
      <div class="video-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${v.type==='youtube'?'#ff0000':'var(--accent-primary)'}" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
      <div class="video-info"><div class="video-name">${App.escapeHtml(v.name||'Vidéo')}</div><div class="video-type">${v.type==='youtube'?'YouTube':'Fichier local'}</div></div>
      <button class="video-remove" data-idx="${i}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`).join('');
    el.querySelectorAll('.video-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const removed = tempVideoRefs.splice(idx, 1)[0];
        if (removed.type === 'local' && removed._tempId) {
          newLocalVideos = newLocalVideos.filter(v => v.tempId !== removed._tempId);
        }
        renderVideoList();
      });
    });
  }

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${isEdit ? 'Modifier' : 'Nouvelle leçon'}</h2>
    <form id="lesson-form">
      <div class="form-group"><label class="form-label">Titre</label><input type="text" class="form-input" id="f-title" value="${App.escapeHtml(lesson.title)}" required placeholder="Ex: Leçon flèche au fleuret"></div>
      <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="f-date" value="${App.toInputDate(lesson.date)}"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-content" placeholder="Décris ce que tu as travaillé...">${App.escapeHtml(lesson.content)}</textarea></div>
      <div class="form-group"><label class="form-label">Tags</label>
        <div class="form-tags">
          ${['technique','tactique','physique','mental'].map(t =>
            `<button type="button" class="form-tag-btn ${(lesson.tags||[]).includes(t)?'active':''}" data-tag="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>
      <div class="form-group video-section"><label class="form-label">Vidéos</label>
        <div class="video-add-btns">
          <button type="button" class="btn btn-secondary btn-sm" id="add-local-video"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Fichier</button>
          <button type="button" class="btn btn-secondary btn-sm" id="add-youtube-video"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> YouTube</button>
        </div>
        <div id="youtube-input-wrap" class="hidden"><div class="youtube-input-area">
          <input type="text" class="form-input" id="youtube-url" placeholder="https://youtube.com/watch?v=...">
          <button type="button" class="btn btn-primary btn-sm" id="youtube-add-confirm">OK</button>
        </div></div>
        <input type="file" id="video-file-input" accept="video/*" style="display:none" multiple>
        <div class="video-list" id="video-list"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Enregistrer' : 'Créer la leçon'}</button>
    </form>
  </div>`;

  renderVideoList();

  // Tags toggle
  document.querySelectorAll('.form-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
  // Local video
  document.getElementById('add-local-video').addEventListener('click', () => {
    document.getElementById('video-file-input').click();
  });
  document.getElementById('video-file-input').addEventListener('change', (e) => {
    for (const file of e.target.files) {
      const tempId = DB.uid();
      newLocalVideos.push({ file, tempId });
      tempVideoRefs.push({ type: 'local', name: file.name, _tempId: tempId });
    }
    renderVideoList();
    e.target.value = '';
  });
  // YouTube
  document.getElementById('add-youtube-video').addEventListener('click', () => {
    document.getElementById('youtube-input-wrap').classList.toggle('hidden');
    document.getElementById('youtube-url').focus();
  });
  document.getElementById('youtube-add-confirm').addEventListener('click', () => {
    const url = document.getElementById('youtube-url').value.trim();
    if (!url) return;
    const ytId = App.extractYoutubeId(url);
    if (!ytId) { App.toast('Lien YouTube invalide', 'error'); return; }
    tempVideoRefs.push({ type: 'youtube', url, name: `YouTube: ${ytId}` });
    document.getElementById('youtube-url').value = '';
    document.getElementById('youtube-input-wrap').classList.add('hidden');
    renderVideoList();
  });
  // Submit
  document.getElementById('lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tags = Array.from(document.querySelectorAll('.form-tag-btn.active')).map(b => b.dataset.tag);
    // Save local videos to IndexedDB
    const finalRefs = [];
    for (const ref of tempVideoRefs) {
      if (ref.type === 'youtube') {
        finalRefs.push({ type: 'youtube', url: ref.url, name: ref.name });
      } else if (ref.type === 'local') {
        if (ref._tempId) {
          const localVid = newLocalVideos.find(v => v.tempId === ref._tempId);
          if (localVid) {
            const videoId = DB.uid();
            await DB.saveVideo({ id: videoId, blob: localVid.file, mimeType: localVid.file.type, name: localVid.file.name });
            finalRefs.push({ type: 'local', videoId, name: ref.name });
          }
        } else if (ref.videoId) {
          finalRefs.push({ type: 'local', videoId: ref.videoId, name: ref.name });
        }
      }
    }
    const data = {
      ...lesson,
      title: document.getElementById('f-title').value.trim(),
      date: document.getElementById('f-date').value || new Date().toISOString().split('T')[0],
      content: document.getElementById('f-content').value,
      tags,
      videoRefs: finalRefs
    };
    await DB.saveLesson(data);
    App.toast(isEdit ? 'Leçon modifiée' : 'Leçon créée');
    location.hash = 'lessons';
  });
};
