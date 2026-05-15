/* ============================================
   EscrimeTracker - Competitions & Bouts Pages
   ============================================ */

// ========== COMPETITIONS LIST ==========
Pages.competitionsList = async function(content) {
  App.setHeader('Compétitions', false);
  const comps = (await DB.getCompetitions()).sort((a,b) => b.date.localeCompare(a.date));
  content.innerHTML = `<div class="page">
    <h2 class="page-title">Compétitions</h2>
    <p class="page-subtitle">${comps.length} compétition${comps.length>1?'s':''}</p>
    <div class="search-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="comp-search" placeholder="Rechercher...">
    </div>
    <div id="comp-list">${_renderCompCards(comps)}</div>
    <a href="#competitions/new" class="fab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </a>
  </div>`;
  document.getElementById('comp-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = comps.filter(c => c.name.toLowerCase().includes(q) || (c.location||'').toLowerCase().includes(q));
    document.getElementById('comp-list').innerHTML = _renderCompCards(filtered);
  });
};

function _renderCompCards(comps) {
  if (!comps.length) return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg><h3>Aucune compétition</h3><p>Enregistre ta première compétition</p></div>`;
  return comps.map(c => `<div class="card card-clickable" onclick="location.hash='competitions/view/${c.id}'">
    <div class="card-header"><span class="card-title">${App.escapeHtml(c.name)}</span>${App.placementBadge(c.placement)}</div>
    <div class="card-body">${App.formatDate(c.date)}${c.location ? ' — ' + App.escapeHtml(c.location) : ''}</div>
    <div class="card-footer"><span class="tag ${App.weaponClass(c.weapon)}">${App.weaponLabel(c.weapon)}</span><span class="tag ${c.level}">${App.levelLabel(c.level)}</span>
      ${c.placement ? `<span class="tag">${c.placement}${c.totalParticipants ? '/' + c.totalParticipants : 'e'}</span>` : ''}</div>
  </div>`).join('');
}

// ========== COMPETITION DETAIL ==========
Pages.competitionDetail = async function(content, id) {
  const comp = await DB.getCompetition(id);
  if (!comp) { location.hash = 'competitions'; return; }
  App.setHeader(comp.name, true, () => location.hash = 'competitions');
  const bouts = (await DB.getBoutsByCompetition(id)).sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''));
  const wins = bouts.filter(b => b.myScore > b.opponentScore).length;
  const losses = bouts.filter(b => b.myScore < b.opponentScore).length;

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${App.escapeHtml(comp.name)}</h2>
    <p class="page-subtitle">${App.formatDate(comp.date)}${comp.location ? ' — ' + App.escapeHtml(comp.location) : ''}</p>
    <div class="card-footer" style="margin-bottom:16px">
      <span class="tag ${App.weaponClass(comp.weapon)}">${App.weaponLabel(comp.weapon)}</span>
      <span class="tag ${comp.level}">${App.levelLabel(comp.level)}</span>
      ${comp.placement ? `<span class="tag">${comp.placement}${comp.totalParticipants ? '/' + comp.totalParticipants : 'e'}</span>` : ''}
    </div>
    ${comp.notes ? `<div class="detail-section"><div class="detail-label">Notes</div><div class="detail-value" style="white-space:pre-wrap">${App.escapeHtml(comp.notes)}</div></div>` : ''}
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-card green"><div class="stat-value" style="font-size:1.4rem">${wins} V</div><div class="stat-label">Victoires</div></div>
      <div class="stat-card red"><div class="stat-value" style="font-size:1.4rem">${losses} D</div><div class="stat-label">Défaites</div></div>
    </div>
    <div class="section-header"><span class="section-title">Assauts (${bouts.length})</span>
      <button class="btn btn-primary btn-sm" id="add-bout-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter</button>
    </div>
    <div id="bouts-list">${bouts.length === 0 ? '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px">Aucun assaut enregistré</p>' :
      bouts.map(b => {
        const isWin = b.myScore > b.opponentScore;
        return `<div class="bout-item card-clickable" data-bout-id="${b.id}">
          <div class="bout-info"><div class="bout-opponent">${App.escapeHtml(b.opponentName||'Inconnu')}</div>
            <div class="bout-meta">${App.boutTypeLabel(b.type)}${b.notes ? ' • ' + App.truncate(b.notes, 30) : ''}</div></div>
          <div class="score-display ${isWin ? 'win' : 'loss'}"><span class="my-score">${b.myScore}</span><span class="sep">-</span><span class="opp-score">${b.opponentScore}</span></div>
        </div>`;
      }).join('')}</div>
    <div class="detail-actions">
      <a href="#competitions/edit/${comp.id}" class="btn btn-secondary" style="flex:1">Modifier</a>
      <button class="btn btn-danger" id="delete-comp-btn" style="flex:1">Supprimer</button>
    </div>
  </div>`;

  document.getElementById('add-bout-btn').addEventListener('click', () => _openBoutModal(id));
  document.querySelectorAll('.bout-item').forEach(el => {
    el.addEventListener('click', () => _openBoutModal(id, el.dataset.boutId));
  });
  document.getElementById('delete-comp-btn').addEventListener('click', async () => {
    if (await App.confirm('Supprimer cette compétition et tous ses assauts ?')) {
      for (const b of bouts) await DB.deleteBout(b.id);
      await DB.deleteCompetition(id);
      App.toast('Compétition supprimée');
      location.hash = 'competitions';
    }
  });
};

// ========== BOUT MODAL ==========
async function _openBoutModal(compId, boutId) {
  let bout = { opponentName: '', myScore: 0, opponentScore: 0, weapon: 'foil', type: 'pool', notes: '', opponentId: '' };
  if (boutId) { const existing = await DB.getBout(boutId); if (existing) bout = existing; }
  const opponents = await DB.getOpponents();
  const isEdit = !!boutId;

  const html = `<form id="bout-form">
    <div class="form-group"><label class="form-label">Adversaire</label>
      <select class="form-select" id="bf-opponent-select">
        <option value="">-- Saisie libre --</option>
        ${opponents.map(o => `<option value="${o.id}" ${bout.opponentId === o.id ? 'selected' : ''}>${App.escapeHtml(o.name)}${o.club ? ' (' + App.escapeHtml(o.club) + ')' : ''}</option>`).join('')}
      </select>
      <input type="text" class="form-input" id="bf-opponent-name" value="${App.escapeHtml(bout.opponentName)}" placeholder="Nom de l'adversaire" style="margin-top:8px">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Mon score</label><input type="number" class="form-input" id="bf-my-score" value="${bout.myScore}" min="0" max="99"></div>
      <div class="form-group"><label class="form-label">Score adverse</label><input type="number" class="form-input" id="bf-opp-score" value="${bout.opponentScore}" min="0" max="99"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Arme</label>
        <select class="form-select" id="bf-weapon"><option value="foil" ${bout.weapon==='foil'?'selected':''}>Fleuret</option><option value="epee" ${bout.weapon==='epee'?'selected':''}>Épée</option><option value="sabre" ${bout.weapon==='sabre'?'selected':''}>Sabre</option></select>
      </div>
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-select" id="bf-type"><option value="pool" ${bout.type==='pool'?'selected':''}>Poule</option><option value="de" ${bout.type==='de'?'selected':''}>Tableau</option><option value="training" ${bout.type==='training'?'selected':''}>Entraînement</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="bf-notes" rows="3" placeholder="Notes tactiques...">${App.escapeHtml(bout.notes||'')}</textarea></div>
    <div style="display:flex;gap:10px">
      <button type="submit" class="btn btn-primary" style="flex:1">${isEdit ? 'Modifier' : 'Ajouter'}</button>
      ${isEdit ? `<button type="button" class="btn btn-danger" id="delete-bout-btn" style="flex:1">Supprimer</button>` : ''}
    </div>
  </form>`;

  App.openModal(isEdit ? 'Modifier l\'assaut' : 'Nouvel assaut', html, () => {
    const oppSelect = document.getElementById('bf-opponent-select');
    oppSelect.addEventListener('change', () => {
      const opp = opponents.find(o => o.id === oppSelect.value);
      if (opp) document.getElementById('bf-opponent-name').value = opp.name;
    });
    document.getElementById('bout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        ...bout,
        competitionId: compId,
        opponentId: document.getElementById('bf-opponent-select').value || '',
        opponentName: document.getElementById('bf-opponent-name').value.trim() || 'Inconnu',
        myScore: parseInt(document.getElementById('bf-my-score').value) || 0,
        opponentScore: parseInt(document.getElementById('bf-opp-score').value) || 0,
        weapon: document.getElementById('bf-weapon').value,
        type: document.getElementById('bf-type').value,
        date: new Date().toISOString(),
        notes: document.getElementById('bf-notes').value
      };
      await DB.saveBout(data);
      App.closeModal();
      App.toast(isEdit ? 'Assaut modifié' : 'Assaut ajouté');
      location.hash = `competitions/view/${compId}`;
      App.navigate();
    });
    if (isEdit) {
      document.getElementById('delete-bout-btn')?.addEventListener('click', async () => {
        await DB.deleteBout(boutId);
        App.closeModal();
        App.toast('Assaut supprimé');
        location.hash = `competitions/view/${compId}`;
        App.navigate();
      });
    }
  });
}

// ========== COMPETITION FORM ==========
Pages.competitionForm = async function(content, id) {
  let comp = { name: '', date: new Date().toISOString(), location: '', weapon: 'foil', level: 'local', placement: '', totalParticipants: '', notes: '' };
  if (id) { const existing = await DB.getCompetition(id); if (existing) comp = existing; }
  const isEdit = !!id;
  App.setHeader(isEdit ? 'Modifier' : 'Nouvelle compétition', true, () => location.hash = 'competitions');

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${isEdit ? 'Modifier la compétition' : 'Nouvelle compétition'}</h2>
    <form id="comp-form">
      <div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="cf-name" value="${App.escapeHtml(comp.name)}" required placeholder="Ex: Championnat régional"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="cf-date" value="${App.toInputDate(comp.date)}"></div>
        <div class="form-group"><label class="form-label">Lieu</label><input type="text" class="form-input" id="cf-location" value="${App.escapeHtml(comp.location||'')}" placeholder="Ville"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Arme</label>
          <select class="form-select" id="cf-weapon"><option value="foil" ${comp.weapon==='foil'?'selected':''}>Fleuret</option><option value="epee" ${comp.weapon==='epee'?'selected':''}>Épée</option><option value="sabre" ${comp.weapon==='sabre'?'selected':''}>Sabre</option></select></div>
        <div class="form-group"><label class="form-label">Niveau</label>
          <select class="form-select" id="cf-level"><option value="local" ${comp.level==='local'?'selected':''}>Local</option><option value="regional" ${comp.level==='regional'?'selected':''}>Régional</option><option value="national" ${comp.level==='national'?'selected':''}>National</option><option value="international" ${comp.level==='international'?'selected':''}>International</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Placement</label><input type="number" class="form-input" id="cf-placement" value="${comp.placement||''}" min="1" placeholder="Ex: 3"></div>
        <div class="form-group"><label class="form-label">Total participants</label><input type="number" class="form-input" id="cf-total" value="${comp.totalParticipants||''}" min="1" placeholder="Ex: 32"></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="cf-notes" rows="3" placeholder="Notes sur la compétition...">${App.escapeHtml(comp.notes||'')}</textarea></div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Enregistrer' : 'Créer'}</button>
    </form>
  </div>`;

  document.getElementById('comp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      ...comp,
      name: document.getElementById('cf-name').value.trim(),
      date: document.getElementById('cf-date').value,
      location: document.getElementById('cf-location').value.trim(),
      weapon: document.getElementById('cf-weapon').value,
      level: document.getElementById('cf-level').value,
      placement: parseInt(document.getElementById('cf-placement').value) || null,
      totalParticipants: parseInt(document.getElementById('cf-total').value) || null,
      notes: document.getElementById('cf-notes').value
    };
    await DB.saveCompetition(data);
    App.toast(isEdit ? 'Compétition modifiée' : 'Compétition créée');
    location.hash = 'competitions';
  });
};
