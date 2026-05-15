/* ============================================
   EscrimeTracker - Pages Object
   All page renderers
   ============================================ */
const Pages = {};

// ========== DASHBOARD ==========
Pages.dashboard = async function(content) {
  App.setHeader('Touche!', false);
  const [lessons, competitions, bouts, opponents] = await Promise.all([
    DB.getLessons(), DB.getCompetitions(), DB.getBouts(), DB.getOpponents()
  ]);
  const wins = bouts.filter(b => b.myScore > b.opponentScore).length;
  const losses = bouts.filter(b => b.myScore < b.opponentScore).length;
  const winRate = bouts.length > 0 ? Math.round((wins / bouts.length) * 100) : 0;
  const recentLessons = lessons.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
  const recentComps = competitions.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (winRate / 100) * circumference;

  content.innerHTML = `<div class="page">
    <h2 class="page-title">Tableau de bord</h2>
    <p class="page-subtitle">Vue d'ensemble de tes performances</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${bouts.length}</div><div class="stat-label">Assauts</div></div>
      <div class="stat-card green"><div class="stat-value">${wins}<span style="font-size:.9rem;color:var(--danger);font-weight:400"> / ${losses}</span></div><div class="stat-label">V / D</div></div>
      <div class="stat-card gold"><div class="stat-value">${competitions.length}</div><div class="stat-label">Compétitions</div></div>
      <div class="stat-card red"><div class="stat-value">${lessons.length}</div><div class="stat-label">Leçons</div></div>
    </div>
    <div class="chart-container" style="text-align:center">
      <div class="chart-title">Taux de victoire</div>
      <div class="winrate-circle">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="42"/>
          <circle class="progress" cx="50" cy="50" r="42" stroke="${winRate >= 50 ? 'var(--success)' : 'var(--danger)'}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="winrate-value">${winRate}%</div>
      </div>
    </div>
    ${recentLessons.length > 0 ? `
      <div class="section-header"><span class="section-title">Dernières leçons</span><a href="#lessons" class="section-link">Voir tout</a></div>
      ${recentLessons.map(l => `<div class="card card-clickable" onclick="location.hash='lessons/view/${l.id}'">
        <div class="card-header"><span class="card-title">${App.escapeHtml(l.title)}</span><span class="card-date">${App.formatDateShort(l.date)}</span></div>
        <div class="card-body">${App.truncate(l.content, 80)}</div>
        <div class="card-footer">${(l.tags||[]).map(t => `<span class="tag ${t}">${t}</span>`).join('')}
          ${(l.videoRefs||[]).length > 0 ? `<span class="tag" style="background:rgba(255,77,109,.12);color:var(--accent-secondary)">🎬 ${l.videoRefs.length}</span>` : ''}</div>
      </div>`).join('')}` : ''}
    ${recentComps.length > 0 ? `
      <div class="section-header"><span class="section-title">Dernières compétitions</span><a href="#competitions" class="section-link">Voir tout</a></div>
      ${recentComps.map(c => `<div class="card card-clickable" onclick="location.hash='competitions/view/${c.id}'">
        <div class="card-header"><span class="card-title">${App.escapeHtml(c.name)}</span>${App.placementBadge(c.placement)}</div>
        <div class="card-body">${App.formatDate(c.date)} — ${App.escapeHtml(c.location||'')}</div>
        <div class="card-footer"><span class="tag ${App.weaponClass(c.weapon)}">${App.weaponLabel(c.weapon)}</span><span class="tag ${c.level}">${App.levelLabel(c.level)}</span></div>
      </div>`).join('')}` : ''}
    ${bouts.length === 0 && lessons.length === 0 ? `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <h3>Bienvenue dans Touche!</h3>
      <p>Commence par ajouter une leçon ou enregistrer une compétition !</p>
    </div>` : ''}
  </div>`;
};
