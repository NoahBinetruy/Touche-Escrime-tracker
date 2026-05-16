/* ============================================
   Touché! - Settings Page (Export/Import + FFE)
   ============================================ */

Pages.settings = async function(content) {
  App.setHeader('Paramètres', false);
  const [lessons, competitions, bouts, opponents] = await Promise.all([
    DB.getLessons(), DB.getCompetitions(), DB.getBouts(), DB.getOpponents()
  ]);
  const prefs = await FFE.getPrefs();

  const CATEGORIES = ['', 'M9', 'M11', 'M13', 'M15', 'M17', 'M20', 'SENIOR', 'V1', 'V2', 'V3', 'V4'];
  const NIVEAUX = [
    { value: '', label: 'Tous niveaux' },
    { value: '1', label: 'International' },
    { value: '2', label: 'National / Interzone' },
    { value: '3', label: 'Régional' },
    { value: '4', label: 'Départemental' },
    { value: '5', label: 'Compétitions internes' },
    { value: '6', label: 'Compétitions libres' }
  ];

  content.innerHTML = `<div class="page">
    <h2 class="page-title">Paramètres</h2>
    <p class="page-subtitle">Préférences et gestion des données</p>

    <div class="chart-container">
      <div class="chart-title">📅 Filtres Calendrier FFE</div>
      <p style="font-size:.8rem;color:var(--text-muted);margin:4px 0 14px">Configure les filtres pour afficher les compétitions qui te concernent sur la page Compétitions.</p>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Arme</label>
          <select class="form-select" id="pref-arme">
            <option value="foil" ${prefs.arme==='foil'?'selected':''}>Fleuret</option>
            <option value="epee" ${prefs.arme==='epee'?'selected':''}>Épée</option>
            <option value="sabre" ${prefs.arme==='sabre'?'selected':''}>Sabre</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Sexe</label>
          <select class="form-select" id="pref-sexe">
            <option value="M" ${prefs.sexe==='M'?'selected':''}>Hommes</option>
            <option value="F" ${prefs.sexe==='F'?'selected':''}>Femmes</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Catégorie</label>
          <select class="form-select" id="pref-categorie">
            ${CATEGORIES.map(c => `<option value="${c}" ${prefs.categorie===c?'selected':''}>${c || 'Toutes'}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Niveau</label>
          <select class="form-select" id="pref-niveau">
            ${NIVEAUX.map(n => `<option value="${n.value}" ${prefs.niveau===n.value?'selected':''}>${n.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="save-ffe-prefs">
        Enregistrer les filtres
      </button>
    </div>

    <div class="chart-container">
      <div class="chart-title">📊 Résumé des données</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <div style="font-size:.85rem;color:var(--text-secondary)">Leçons : <strong>${lessons.length}</strong></div>
        <div style="font-size:.85rem;color:var(--text-secondary)">Compétitions : <strong>${competitions.length}</strong></div>
        <div style="font-size:.85rem;color:var(--text-secondary)">Assauts : <strong>${bouts.length}</strong></div>
        <div style="font-size:.85rem;color:var(--text-secondary)">Adversaires : <strong>${opponents.length}</strong></div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">💾 Sauvegarder</div>
      <p style="font-size:.85rem;color:var(--text-muted);margin:8px 0 16px">Exporte toutes tes données dans un fichier JSON que tu pourras réimporter plus tard.</p>
      <button class="btn btn-primary btn-block" id="export-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exporter mes données
      </button>
    </div>

    <div class="chart-container">
      <div class="chart-title">📂 Restaurer</div>
      <p style="font-size:.85rem;color:var(--text-muted);margin:8px 0 4px">Importe un fichier JSON précédemment exporté.</p>
      <p style="font-size:.8rem;color:var(--danger);margin:0 0 16px">⚠️ Attention : l'import remplace toutes les données actuelles.</p>
      <button class="btn btn-secondary btn-block" id="import-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Importer un fichier
      </button>
      <input type="file" id="import-file-input" accept=".json" style="display:none">
    </div>

    <div class="chart-container">
      <div class="chart-title">🔗 Liens utiles</div>
      <a href="https://www.ffescrime.fr/calendrier/" target="_blank" rel="noopener" class="settings-link">
        📅 Calendrier FFE — Compétitions à venir
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      <a href="https://www.ffescrime.fr/classements/" target="_blank" rel="noopener" class="settings-link">
        🏆 Classements FFE
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>

    <div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:.75rem">
      Touché! v2.1 — Application hors-ligne<br>Données stockées localement sur ton appareil
    </div>
  </div>`;

  // Save FFE prefs
  document.getElementById('save-ffe-prefs').addEventListener('click', async () => {
    const newPrefs = {
      arme: document.getElementById('pref-arme').value,
      sexe: document.getElementById('pref-sexe').value,
      categorie: document.getElementById('pref-categorie').value,
      niveau: document.getElementById('pref-niveau').value
    };
    await FFE.savePrefs(newPrefs);
    App.toast('Filtres FFE enregistrés !');
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', async () => {
    try {
      App.toast('Export en cours...');
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `touche_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      App.toast('Export réussi !');
    } catch(err) {
      console.error(err);
      App.toast('Erreur lors de l\'export', 'error');
    }
  });

  // Import
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!await App.confirm('Importer ce fichier ? Toutes les données actuelles seront remplacées.')) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.data || !json.app) throw new Error('Format invalide');
      App.toast('Import en cours...');
      await DB.importAll(json);
      App.toast('Import réussi ! Rechargement...');
      setTimeout(() => { location.hash = 'dashboard'; App.navigate(); }, 1000);
    } catch(err) {
      console.error(err);
      App.toast('Erreur : fichier invalide', 'error');
    }
  });
};
