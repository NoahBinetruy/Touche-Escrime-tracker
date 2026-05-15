/* ============================================
   EscrimeTracker - Opponents Pages
   ============================================ */

// ========== OPPONENTS LIST ==========
Pages.opponentsList = async function(content) {
  App.setHeader('Adversaires', false);
  const opponents = (await DB.getOpponents()).sort((a,b) => (a.name||'').localeCompare(b.name||''));
  content.innerHTML = `<div class="page">
    <h2 class="page-title">Adversaires</h2>
    <p class="page-subtitle">${opponents.length} adversaire${opponents.length>1?'s':''}</p>
    <div class="search-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="opp-search" placeholder="Rechercher un adversaire...">
    </div>
    <div id="opp-list">${_renderOppCards(opponents)}</div>
    <a href="#opponents/new" class="fab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </a>
  </div>`;
  document.getElementById('opp-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = opponents.filter(o => o.name.toLowerCase().includes(q) || (o.club||'').toLowerCase().includes(q));
    document.getElementById('opp-list').innerHTML = _renderOppCards(filtered);
  });
};

function _renderOppCards(opponents) {
  if (!opponents.length) return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>Aucun adversaire</h3><p>Ajoute un profil pour suivre tes résultats contre chaque adversaire</p></div>`;
  return opponents.map(o => `<div class="card card-clickable" onclick="location.hash='opponents/view/${o.id}'">
    <div class="card-header">
      <span class="card-title">${App.escapeHtml(o.name)}</span>
      <span style="font-size:.75rem;color:var(--text-muted)">${o.handedness === 'left' ? '🤚 Gaucher' : '✋ Droitier'}</span>
    </div>
    <div class="card-body">${o.club ? App.escapeHtml(o.club) : '<span style="color:var(--text-muted)">Pas de club</span>'}
      ${o.ranking ? ' • Classement: ' + App.escapeHtml(o.ranking) : ''}</div>
    <div class="card-footer">
      ${o.grip ? `<span class="tag">${o.grip === 'french' ? 'Française' : 'Pistolet'}</span>` : ''}
      ${o.notes ? `<span class="tag">📝 Notes</span>` : ''}
    </div>
  </div>`).join('');
}

// ========== OPPONENT DETAIL ==========
Pages.opponentDetail = async function(content, id) {
  const opp = await DB.getOpponent(id);
  if (!opp) { location.hash = 'opponents'; return; }
  App.setHeader(opp.name, true, () => location.hash = 'opponents');
  const bouts = await DB.getBoutsByOpponent(id);
  const wins = bouts.filter(b => b.myScore > b.opponentScore).length;
  const losses = bouts.filter(b => b.myScore < b.opponentScore).length;

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${App.escapeHtml(opp.name)}</h2>
    <p class="page-subtitle">${opp.club ? App.escapeHtml(opp.club) : 'Pas de club renseigné'}</p>
    <div class="stats-grid" style="margin:16px 0">
      <div class="stat-card green"><div class="stat-value" style="font-size:1.4rem">${wins}</div><div class="stat-label">Victoires</div></div>
      <div class="stat-card red"><div class="stat-value" style="font-size:1.4rem">${losses}</div><div class="stat-label">Défaites</div></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Profil</div>
      <div class="card" style="margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.85rem">
          <div><span style="color:var(--text-muted)">Latéralité:</span><br><strong>${opp.handedness === 'left' ? 'Gaucher' : 'Droitier'}</strong></div>
          <div><span style="color:var(--text-muted)">Garde:</span><br><strong>${opp.grip === 'french' ? 'Française' : opp.grip === 'pistol' ? 'Pistolet' : 'Non renseigné'}</strong></div>
          <div><span style="color:var(--text-muted)">Classement:</span><br><strong>${opp.ranking ? App.escapeHtml(opp.ranking) : 'Non renseigné'}</strong></div>
        </div>
      </div>
    </div>
    ${opp.notes ? `<div class="detail-section"><div class="detail-label">Notes tactiques</div><div class="detail-value" style="white-space:pre-wrap">${App.escapeHtml(opp.notes)}</div></div>` : ''}
    ${bouts.length > 0 ? `<div class="section-header"><span class="section-title">Historique (${bouts.length})</span></div>
      ${bouts.sort((a,b) => b.date.localeCompare(a.date)).map(b => {
        const isWin = b.myScore > b.opponentScore;
        return `<div class="bout-item"><div class="bout-info"><div class="bout-meta">${App.formatDateShort(b.date)} • ${App.boutTypeLabel(b.type)}</div></div>
          <div class="score-display ${isWin?'win':'loss'}"><span class="my-score">${b.myScore}</span><span class="sep">-</span><span class="opp-score">${b.opponentScore}</span></div></div>`;
      }).join('')}` : ''}
    <div class="detail-actions">
      <a href="#opponents/edit/${opp.id}" class="btn btn-secondary" style="flex:1">Modifier</a>
      <button class="btn btn-danger" id="delete-opp-btn" style="flex:1">Supprimer</button>
    </div>
  </div>`;
  document.getElementById('delete-opp-btn').addEventListener('click', async () => {
    if (await App.confirm('Supprimer cet adversaire ?')) {
      await DB.deleteOpponent(id);
      App.toast('Adversaire supprimé');
      location.hash = 'opponents';
    }
  });
};

// ========== OPPONENT FORM ==========
Pages.opponentForm = async function(content, id) {
  let opp = { name: '', club: '', handedness: 'right', grip: '', ranking: '', notes: '' };
  if (id) { const existing = await DB.getOpponent(id); if (existing) opp = existing; }
  const isEdit = !!id;
  App.setHeader(isEdit ? 'Modifier' : 'Nouvel adversaire', true, () => location.hash = 'opponents');

  content.innerHTML = `<div class="page">
    <h2 class="page-title">${isEdit ? 'Modifier l\'adversaire' : 'Nouvel adversaire'}</h2>
    <form id="opp-form">
      <div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="of-name" value="${App.escapeHtml(opp.name)}" required placeholder="Nom complet"></div>
      <div class="form-group"><label class="form-label">Club</label><input type="text" class="form-input" id="of-club" value="${App.escapeHtml(opp.club||'')}" placeholder="Club d'escrime"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Latéralité</label>
          <select class="form-select" id="of-hand"><option value="right" ${opp.handedness==='right'?'selected':''}>Droitier</option><option value="left" ${opp.handedness==='left'?'selected':''}>Gaucher</option></select></div>
        <div class="form-group"><label class="form-label">Garde</label>
          <select class="form-select" id="of-grip"><option value="">Non renseigné</option><option value="french" ${opp.grip==='french'?'selected':''}>Française</option><option value="pistol" ${opp.grip==='pistol'?'selected':''}>Pistolet</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Classement</label><input type="text" class="form-input" id="of-ranking" value="${App.escapeHtml(opp.ranking||'')}" placeholder="Ex: 42e national"></div>
      <div class="form-group"><label class="form-label">Notes tactiques</label><textarea class="form-textarea" id="of-notes" rows="4" placeholder="Points forts, faiblesses, habitudes...">${App.escapeHtml(opp.notes||'')}</textarea></div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Enregistrer' : 'Créer'}</button>
    </form>
  </div>`;

  document.getElementById('opp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      ...opp,
      name: document.getElementById('of-name').value.trim(),
      club: document.getElementById('of-club').value.trim(),
      handedness: document.getElementById('of-hand').value,
      grip: document.getElementById('of-grip').value,
      ranking: document.getElementById('of-ranking').value.trim(),
      notes: document.getElementById('of-notes').value
    };
    await DB.saveOpponent(data);
    App.toast(isEdit ? 'Adversaire modifié' : 'Adversaire créé');
    location.hash = 'opponents';
  });
};
