/* ============================================
   Touché! - Pages Object + Dashboard
   ============================================ */
const Pages = {};

// ========== DASHBOARD ==========
Pages.dashboard = async function(content) {
  App.setHeader('Touché!', false);
  const [lessons, competitions, bouts, opponents] = await Promise.all([
    DB.getLessons(), DB.getCompetitions(), DB.getBouts(), DB.getOpponents()
  ]);
  const wins = bouts.filter(b => b.myScore > b.opponentScore).length;
  const losses = bouts.filter(b => b.myScore < b.opponentScore).length;
  const winRate = bouts.length > 0 ? Math.round((wins / bouts.length) * 100) : 0;
  const recentLessons = lessons.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
  const recentComps = competitions.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);

  // Next competition countdown
  const today = new Date().toISOString().split('T')[0];
  const futureComps = competitions.filter(c => c.date >= today).sort((a,b) => a.date.localeCompare(b.date));
  const nextComp = futureComps.length > 0 ? futureComps[0] : null;
  let countdownHtml = '';
  if (nextComp) {
    const nextDate = new Date(nextComp.date + 'T12:00:00');
    const now = new Date();
    const diffMs = nextDate - now;
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    countdownHtml = `<div class="countdown-card" onclick="location.hash='competitions/view/${nextComp.id}'">
      <div class="countdown-label">Prochaine compétition</div>
      <div class="countdown-name">${App.escapeHtml(nextComp.name)}</div>
      <div class="countdown-timer">
        <div class="countdown-number">${diffDays}</div>
        <div class="countdown-unit">jour${diffDays > 1 ? 's' : ''}</div>
      </div>
      <div class="countdown-date">${App.formatDate(nextComp.date)}${nextComp.location ? ' — ' + App.escapeHtml(nextComp.location) : ''}</div>
    </div>`;
  }

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (winRate / 100) * circumference;

  content.innerHTML = `<div class="page">
    <h2 class="page-title">Tableau de bord</h2>
    <p class="page-subtitle">Vue d'ensemble de tes performances</p>
    ${countdownHtml}
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
    <div class="section-header"><span class="section-title">Calendrier FFE</span></div>
    <a href="https://www.ffescrime.fr/calendrier/" target="_blank" rel="noopener" class="ffe-link-card">
      <div class="ffe-link-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      <div class="ffe-link-content">
        <div class="ffe-link-title">Voir les compétitions à venir</div>
        <div class="ffe-link-sub">ffescrime.fr — Calendrier sportif</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
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
      <h3>Bienvenue dans Touché!</h3>
      <p>Commence par ajouter une leçon ou enregistrer une compétition !</p>
    </div>` : ''}
  </div>`;
};
