/* ============================================
   EscrimeTracker - Statistics Page
   ============================================ */

Pages.stats = async function(content) {
  App.setHeader('Statistiques', false);
  const [bouts, competitions, opponents] = await Promise.all([
    DB.getBouts(), DB.getCompetitions(), DB.getOpponents()
  ]);

  const totalBouts = bouts.length;
  const wins = bouts.filter(b => b.myScore > b.opponentScore).length;
  const losses = totalBouts - wins;
  const winRate = totalBouts > 0 ? Math.round((wins / totalBouts) * 100) : 0;

  // Stats by weapon
  const weapons = ['foil', 'epee', 'sabre'];
  const weaponStats = weapons.map(w => {
    const wb = bouts.filter(b => b.weapon === w);
    const ww = wb.filter(b => b.myScore > b.opponentScore).length;
    return { weapon: w, total: wb.length, wins: ww, losses: wb.length - ww, rate: wb.length > 0 ? Math.round((ww / wb.length) * 100) : 0 };
  }).filter(s => s.total > 0);

  // Stats by type
  const types = ['pool', 'de', 'training'];
  const typeStats = types.map(t => {
    const tb = bouts.filter(b => b.type === t);
    const tw = tb.filter(b => b.myScore > b.opponentScore).length;
    return { type: t, total: tb.length, wins: tw, rate: tb.length > 0 ? Math.round((tw / tb.length) * 100) : 0 };
  }).filter(s => s.total > 0);

  // Monthly trend (last 6 months)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const mb = bouts.filter(b => b.date && b.date.startsWith(key));
    const mw = mb.filter(b => b.myScore > b.opponentScore).length;
    months.push({ label, total: mb.length, wins: mw, losses: mb.length - mw });
  }
  const maxMonthBouts = Math.max(...months.map(m => m.total), 1);

  // Top opponents
  const oppStats = {};
  bouts.forEach(b => {
    const name = b.opponentName || 'Inconnu';
    if (!oppStats[name]) oppStats[name] = { name, wins: 0, losses: 0, total: 0 };
    oppStats[name].total++;
    if (b.myScore > b.opponentScore) oppStats[name].wins++;
    else oppStats[name].losses++;
  });
  const topOpponents = Object.values(oppStats).sort((a,b) => b.total - a.total).slice(0, 5);

  // Competition placements
  const placedComps = competitions.filter(c => c.placement).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Win rate circle
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (winRate / 100) * circumference;

  content.innerHTML = `<div class="page">
    <h2 class="page-title">Statistiques</h2>
    <p class="page-subtitle">Analyse de tes performances</p>

    ${totalBouts === 0 ? `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><h3>Pas encore de données</h3><p>Enregistre des assauts pour voir tes statistiques</p></div>` : `

    <div class="chart-container" style="text-align:center">
      <div class="chart-title">Taux de victoire global</div>
      <div class="winrate-circle">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="42"/>
          <circle class="progress" cx="50" cy="50" r="42" stroke="${winRate >= 50 ? 'var(--success)' : 'var(--danger)'}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="winrate-value">${winRate}%</div>
      </div>
      <div style="display:flex;justify-content:center;gap:24px;margin-top:8px;font-size:.85rem">
        <span style="color:var(--success)">✓ ${wins} V</span>
        <span style="color:var(--text-muted)">${totalBouts} assauts</span>
        <span style="color:var(--danger)">✗ ${losses} D</span>
      </div>
    </div>

    ${weaponStats.length > 0 ? `<div class="chart-container">
      <div class="chart-title">Par arme</div>
      ${weaponStats.map(s => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span class="tag ${App.weaponClass(s.weapon)}" style="min-width:60px;justify-content:center">${App.weaponLabel(s.weapon)}</span>
        <div style="flex:1;height:8px;background:var(--bg-input);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${s.rate}%;background:var(--${App.weaponClass(s.weapon)}-color, var(--accent-primary));border-radius:4px;transition:width 1s ease"></div>
        </div>
        <span style="font-size:.8rem;font-weight:700;min-width:40px;text-align:right">${s.rate}%</span>
        <span style="font-size:.7rem;color:var(--text-muted);min-width:35px">${s.wins}/${s.total}</span>
      </div>`).join('')}
    </div>` : ''}

    ${typeStats.length > 0 ? `<div class="chart-container">
      <div class="chart-title">Par type d'assaut</div>
      ${typeStats.map(s => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:.8rem;color:var(--text-secondary);min-width:80px">${App.boutTypeLabel(s.type)}</span>
        <div style="flex:1;height:8px;background:var(--bg-input);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${s.rate}%;background:var(--accent-primary);border-radius:4px;transition:width 1s ease"></div>
        </div>
        <span style="font-size:.8rem;font-weight:700;min-width:40px;text-align:right">${s.rate}%</span>
      </div>`).join('')}
    </div>` : ''}

    <div class="chart-container">
      <div class="chart-title">Évolution (6 derniers mois)</div>
      <div class="bar-chart">
        ${months.map(m => `<div class="bar-col">
          <div class="bar-value">${m.total > 0 ? m.wins + '/' + m.total : ''}</div>
          <div style="display:flex;gap:2px;align-items:flex-end;width:100%;justify-content:center;height:100%">
            <div class="bar green" style="height:${m.wins > 0 ? Math.max((m.wins / maxMonthBouts) * 100, 5) : 0}%;max-width:12px"></div>
            <div class="bar red" style="height:${m.losses > 0 ? Math.max((m.losses / maxMonthBouts) * 100, 5) : 0}%;max-width:12px"></div>
          </div>
          <div class="bar-label">${m.label}</div>
        </div>`).join('')}
      </div>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:.7rem;color:var(--text-muted)">
        <span><span style="display:inline-block;width:8px;height:8px;background:var(--success);border-radius:2px;margin-right:4px"></span>Victoires</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:var(--danger);border-radius:2px;margin-right:4px"></span>Défaites</span>
      </div>
    </div>

    ${topOpponents.length > 0 ? `<div class="chart-container">
      <div class="chart-title">Top adversaires</div>
      ${topOpponents.map(o => {
        const rate = Math.round((o.wins / o.total) * 100);
        return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <span style="font-size:.85rem;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${App.escapeHtml(o.name)}</span>
          <span class="tag ${rate >= 50 ? 'win' : 'loss'}">${o.wins}V ${o.losses}D</span>
          <span style="font-size:.8rem;font-weight:700;min-width:35px;text-align:right">${rate}%</span>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${placedComps.length > 0 ? `<div class="chart-container">
      <div class="chart-title">Derniers classements</div>
      ${placedComps.map(c => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        ${App.placementBadge(c.placement)}
        <div style="flex:1"><div style="font-size:.85rem;font-weight:600">${App.escapeHtml(c.name)}</div>
          <div style="font-size:.7rem;color:var(--text-muted)">${App.formatDateShort(c.date)}${c.totalParticipants ? ' • ' + c.totalParticipants + ' tireurs' : ''}</div></div>
        <span class="tag ${App.weaponClass(c.weapon)}">${App.weaponLabel(c.weapon)}</span>
      </div>`).join('')}
    </div>` : ''}
    `}
  </div>`;
};
