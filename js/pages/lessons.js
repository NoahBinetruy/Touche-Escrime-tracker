/* ============================================
   Touché! - Lessons Pages
   ============================================ */

// ========== MOOD HELPERS ==========
const MOODS = [
  { value: 1, emoji: '😤', label: 'Frustrant' },
  { value: 2, emoji: '😐', label: 'Moyen' },
  { value: 3, emoji: '🙂', label: 'Correct' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🤩', label: 'Excellent' }
];

function moodEmoji(val) {
  const m = MOODS.find(m => m.value === val);
  return m ? m.emoji : '';
}

function renderStars(val) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += `<span style="color:${i <= val ? 'var(--gold)' : 'var(--text-muted)'}">★</span>`;
  return s;
}

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
  if (query) filtered = filtered.filter(l => l.title.toLowerCase().includes(query) || (l.content||'').toLowerCase().includes(query) || (l.keyPoints||'').toLowerCase().includes(query));
  document.getElementById('lessons-list').innerHTML = _renderLessonCards(filtered);
}

function _renderLessonCards(lessons) {
  if (lessons.length === 0) return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    <h3>Aucune leçon</h3><p>Ajoute ta première leçon pour commencer ton carnet</p></div>`;
  return lessons.map(l => {
    const moodStr = l.mood ? `<span style="font-size:1.1rem">${moodEmoji(l.mood)}</span>` : '';
    const diffStr = l.difficulty ? `<span style="font-size:.7rem">${renderStars(l.difficulty)}</span>` : '';
    const mediaCount = ((l.videoRefs||[]).length) + ((l.photoRefs||[]).length);
    return `<div class="card card-clickable" onclick="location.hash='lessons/view/${l.id}'">
    <div class="card-header"><span class="card-title">${App.escapeHtml(l.title)}</span><span class="card-date">${App.formatDateShort(l.date)}</span></div>
    ${l.keyPoints ? `<div style="padding:0 16px 4px;font-size:.8rem;color:var(--accent-primary);font-weight:500">🎯 ${App.truncate(App.escapeHtml(l.keyPoints), 60)}</div>` : ''}
    <div class="card-body">${App.truncate(App.escapeHtml(l.content), 80)}</div>
    <div class="card-footer">${(l.tags||[]).map(t => `<span class="tag ${t}">${t}</span>`).join('')}
      ${mediaCount > 0 ? `<span class="tag" style="background:rgba(255,77,109,.12);color:var(--accent-secondary)">📎 ${mediaCount}</span>` : ''}
      ${moodStr}${diffStr}
    </div>
  </div>`;
  }).join('');
}

// ========== LESSON DETAIL ==========
Pages.lessonDetail = async function(content, id) {
  const lesson = await DB.getLesson(id);
  if (!lesson) { location.hash = 'lessons'; return; }
  App.setHeader('Leçon', true, () => location.hash = 'lessons');

  // Videos HTML
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

  // Photos HTML
  let photosHtml = '';
  if (lesson.photoRefs && lesson.photoRefs.length > 0) {
    photosHtml = '<div class="detail-section"><div class="detail-label">Photos</div><div class="photo-grid">';
    for (const p of lesson.photoRefs) {
      try {
        const photo = await DB.getPhoto(p.photoId);
        if (photo) {
          const url = URL.createObjectURL(photo.blob);
          photosHtml += `<div class="photo-thumb" onclick="App.openModal('Photo', '<img src=\\'${url}\\' style=\\'width:100%;border-radius:8px\\' />')">
            <img src="${url}" alt="${App.escapeHtml(p.name||'Photo')}">
          </div>`;
        }
      } catch(e) {}
    }
    photosHtml += '</div></div>';
  }

  // Evaluation HTML
  let evalHtml = '';
  if (lesson.mood || lesson.difficulty) {
    evalHtml = '<div class="eval-badges">';
    if (lesson.mood) evalHtml += `<div class="eval-badge"><span style="font-size:1.4rem">${moodEmoji(lesson.mood)}</span><span class="eval-badge-label">${MOODS.find(m=>m.value===lesson.mood)?.label||''}</span></div>`;
    if (lesson.difficulty) evalHtml += `<div class="eval-badge"><span style="font-size:1rem">${renderStars(lesson.difficulty)}</span><span class="eval-badge-label">Difficulté</span></div>`;
    evalHtml += '</div>';
  }

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${App.escapeHtml(lesson.title)}</h2>
    <p class="page-subtitle">${App.formatDate(lesson.date)}</p>
    <div class="card-footer" style="margin-bottom:12px">${(lesson.tags||[]).map(t => `<span class="tag ${t}">${t}</span>`).join('')}</div>
    ${evalHtml}
    ${lesson.keyPoints ? `<div class="detail-section key-points-box">
      <div class="detail-label">🎯 Points clés</div>
      <div class="detail-value" style="white-space:pre-wrap;font-weight:500;color:var(--accent-primary)">${App.escapeHtml(lesson.keyPoints)}</div>
    </div>` : ''}
    <div class="detail-section"><div class="detail-label">Notes</div>
      <div class="detail-value" style="white-space:pre-wrap">${App.escapeHtml(lesson.content)}</div>
    </div>
    ${videosHtml}
    ${photosHtml}
    <div class="detail-actions">
      <a href="#lessons/edit/${lesson.id}" class="btn btn-primary" style="flex:1">Modifier</a>
      <button class="btn btn-danger" id="delete-lesson-btn" style="flex:1">Supprimer</button>
    </div>
  </div>`;
  document.getElementById('delete-lesson-btn').addEventListener('click', async () => {
    if (await App.confirm('Supprimer cette leçon ?')) {
      if (lesson.videoRefs) for (const v of lesson.videoRefs) { if (v.type === 'local' && v.videoId) await DB.deleteVideo(v.videoId); }
      if (lesson.photoRefs) for (const p of lesson.photoRefs) { if (p.photoId) await DB.deletePhoto(p.photoId); }
      await DB.deleteLesson(id);
      App.toast('Leçon supprimée');
      location.hash = 'lessons';
    }
  });
};

// ========== LESSON FORM ==========
Pages.lessonForm = async function(content, id) {
  let lesson = { title: '', date: new Date().toISOString(), content: '', keyPoints: '', tags: [], mood: 0, difficulty: 0, videoRefs: [], photoRefs: [] };
  if (id) {
    const existing = await DB.getLesson(id);
    if (existing) lesson = { ...lesson, ...existing };
  }
  const isEdit = !!id;
  App.setHeader(isEdit ? 'Modifier la leçon' : 'Nouvelle leçon', true, () => location.hash = 'lessons');

  // Temp refs storage
  let tempVideoRefs = [...(lesson.videoRefs || [])];
  let newLocalVideos = [];
  let tempPhotoRefs = [...(lesson.photoRefs || [])];
  let newLocalPhotos = [];

  function renderVideoList() {
    const el = document.getElementById('video-list');
    if (!el) return;
    if (tempVideoRefs.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = tempVideoRefs.map((v, i) => `<div class="video-item">
      <div class="video-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${v.type==='youtube'?'#ff0000':'var(--accent-primary)'}" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
      <div class="video-info"><div class="video-name">${App.escapeHtml(v.name||'Vidéo')}</div><div class="video-type">${v.type==='youtube'?'YouTube':'Fichier local'}</div></div>
      <button class="video-remove" data-idx="${i}" data-kind="video"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`).join('');
    _bindRemoveButtons(el, 'video');
  }

  function renderPhotoList() {
    const el = document.getElementById('photo-list');
    if (!el) return;
    if (tempPhotoRefs.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = tempPhotoRefs.map((p, i) => `<div class="video-item">
      <div class="video-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
      <div class="video-info"><div class="video-name">${App.escapeHtml(p.name||'Photo')}</div><div class="video-type">Image</div></div>
      <button class="video-remove" data-idx="${i}" data-kind="photo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`).join('');
    _bindRemoveButtons(el, 'photo');
  }

  function _bindRemoveButtons(el, kind) {
    el.querySelectorAll('.video-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        if (kind === 'video') {
          const removed = tempVideoRefs.splice(idx, 1)[0];
          if (removed.type === 'local' && removed._tempId) newLocalVideos = newLocalVideos.filter(v => v.tempId !== removed._tempId);
          renderVideoList();
        } else {
          const removed = tempPhotoRefs.splice(idx, 1)[0];
          if (removed._tempId) newLocalPhotos = newLocalPhotos.filter(p => p.tempId !== removed._tempId);
          renderPhotoList();
        }
      });
    });
  }

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${isEdit ? 'Modifier' : 'Nouvelle leçon'}</h2>
    <form id="lesson-form">
      <div class="form-group"><label class="form-label">Titre</label><input type="text" class="form-input" id="f-title" value="${App.escapeHtml(lesson.title)}" required placeholder="Ex: Leçon flèche au fleuret"></div>
      <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="f-date" value="${App.toInputDate(lesson.date)}"></div>

      <div class="form-group"><label class="form-label">Ressenti</label>
        <div class="mood-selector" id="mood-selector">
          ${MOODS.map(m => `<button type="button" class="mood-btn ${lesson.mood===m.value?'active':''}" data-mood="${m.value}" title="${m.label}"><span>${m.emoji}</span></button>`).join('')}
        </div>
      </div>

      <div class="form-group"><label class="form-label">Difficulté</label>
        <div class="star-selector" id="star-selector">
          ${[1,2,3,4,5].map(i => `<button type="button" class="star-btn ${lesson.difficulty>=i?'active':''}" data-star="${i}">★</button>`).join('')}
        </div>
      </div>

      <div class="form-group"><label class="form-label">🎯 Points clés / À retenir</label><textarea class="form-textarea" id="f-keypoints" rows="2" placeholder="Les enseignements principaux de cette leçon...">${App.escapeHtml(lesson.keyPoints||'')}</textarea></div>

      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-content" placeholder="Décris ce que tu as travaillé...">${App.escapeHtml(lesson.content)}</textarea></div>

      <div class="form-group"><label class="form-label">Tags</label>
        <div class="form-tags">
          ${['technique','tactique','physique','mental'].map(t =>
            `<button type="button" class="form-tag-btn ${(lesson.tags||[]).includes(t)?'active':''}" data-tag="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>

      <div class="form-group video-section"><label class="form-label">Médias</label>
        <div class="video-add-btns">
          <button type="button" class="btn btn-secondary btn-sm" id="add-local-video"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Vidéo</button>
          <button type="button" class="btn btn-secondary btn-sm" id="add-youtube-video"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> YouTube</button>
          <button type="button" class="btn btn-secondary btn-sm" id="add-photo-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Photo</button>
        </div>
        <div id="youtube-input-wrap" class="hidden"><div class="youtube-input-area">
          <input type="text" class="form-input" id="youtube-url" placeholder="https://youtube.com/watch?v=...">
          <button type="button" class="btn btn-primary btn-sm" id="youtube-add-confirm">OK</button>
        </div></div>
        <input type="file" id="video-file-input" accept="video/*" style="display:none" multiple>
        <input type="file" id="photo-file-input" accept="image/*" style="display:none" multiple>
        <div class="video-list" id="video-list"></div>
        <div class="video-list" id="photo-list"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Enregistrer' : 'Créer la leçon'}</button>
    </form>
  </div>`;

  renderVideoList();
  renderPhotoList();

  // Mood selector
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Star selector
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.star);
      document.querySelectorAll('.star-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.star) <= val);
      });
    });
  });

  // Tags toggle
  document.querySelectorAll('.form-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  // Local video
  document.getElementById('add-local-video').addEventListener('click', () => document.getElementById('video-file-input').click());
  document.getElementById('video-file-input').addEventListener('change', (e) => {
    for (const file of e.target.files) {
      const tempId = DB.uid();
      newLocalVideos.push({ file, tempId });
      tempVideoRefs.push({ type: 'local', name: file.name, _tempId: tempId });
    }
    renderVideoList();
    e.target.value = '';
  });

  // Photos
  document.getElementById('add-photo-btn').addEventListener('click', () => document.getElementById('photo-file-input').click());
  document.getElementById('photo-file-input').addEventListener('change', (e) => {
    for (const file of e.target.files) {
      const tempId = DB.uid();
      newLocalPhotos.push({ file, tempId });
      tempPhotoRefs.push({ name: file.name, _tempId: tempId });
    }
    renderPhotoList();
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
    const activeMood = document.querySelector('.mood-btn.active');
    const mood = activeMood ? parseInt(activeMood.dataset.mood) : 0;
    const activeStars = document.querySelectorAll('.star-btn.active');
    const difficulty = activeStars.length;

    // Save local videos to IndexedDB
    const finalVideoRefs = [];
    for (const ref of tempVideoRefs) {
      if (ref.type === 'youtube') {
        finalVideoRefs.push({ type: 'youtube', url: ref.url, name: ref.name });
      } else if (ref.type === 'local') {
        if (ref._tempId) {
          const localVid = newLocalVideos.find(v => v.tempId === ref._tempId);
          if (localVid) {
            const videoId = DB.uid();
            await DB.saveVideo({ id: videoId, blob: localVid.file, mimeType: localVid.file.type, name: localVid.file.name });
            finalVideoRefs.push({ type: 'local', videoId, name: ref.name });
          }
        } else if (ref.videoId) {
          finalVideoRefs.push({ type: 'local', videoId: ref.videoId, name: ref.name });
        }
      }
    }

    // Save photos
    const finalPhotoRefs = [];
    for (const ref of tempPhotoRefs) {
      if (ref._tempId) {
        const localPhoto = newLocalPhotos.find(p => p.tempId === ref._tempId);
        if (localPhoto) {
          const photoId = DB.uid();
          await DB.savePhoto({ id: photoId, blob: localPhoto.file, mimeType: localPhoto.file.type, name: localPhoto.file.name });
          finalPhotoRefs.push({ photoId, name: ref.name });
        }
      } else if (ref.photoId) {
        finalPhotoRefs.push({ photoId: ref.photoId, name: ref.name });
      }
    }

    const data = {
      ...lesson,
      title: document.getElementById('f-title').value.trim(),
      date: document.getElementById('f-date').value || new Date().toISOString().split('T')[0],
      content: document.getElementById('f-content').value,
      keyPoints: document.getElementById('f-keypoints').value.trim(),
      tags,
      mood,
      difficulty,
      videoRefs: finalVideoRefs,
      photoRefs: finalPhotoRefs
    };
    await DB.saveLesson(data);
    App.toast(isEdit ? 'Leçon modifiée' : 'Leçon créée');
    location.hash = 'lessons';
  });
};
