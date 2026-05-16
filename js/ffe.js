/* ============================================
   Touché! - FFE Calendar Scraper
   Fetches upcoming competitions from ffescrime.fr
   ============================================ */

const FFE = (() => {
  const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
  ];
  const BASE_URL = 'https://www.ffescrime.fr/calendrier/';

  // Arme codes used by FFE
  const ARME_CODES = {
    foil: 'FLE',
    epee: 'EPE',
    sabre: 'SAB'
  };

  // Build the FFE calendar URL with filters
  function buildUrl(prefs) {
    const params = new URLSearchParams();
    params.set('lieu_ville', '');
    // Arme
    if (prefs.arme) params.set(`arme[${ARME_CODES[prefs.arme] || 'FLE'}]`, 'on');
    // Sexe
    if (prefs.sexe) params.set(`sexe[${prefs.sexe}]`, 'on');
    // Catégorie
    if (prefs.categorie) params.set('categories', prefs.categorie);
    // Niveau
    if (prefs.niveau) params.set('niveaux', prefs.niveau);
    params.set('date', '');
    params.set('final-date', '');
    params.set('regions', '');
    params.set('departements', '');
    return BASE_URL + '?' + params.toString();
  }

  // Parse the FFE HTML to extract competition data
  function parseCompetitions(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const comps = [];

    // FFE uses list items with specific structure
    const items = doc.querySelectorAll('.competitions-list-wrapper li, .list-competitions li, .competition-item, .col-lg-12.p-0');

    // Fallback: parse all links pointing to /competition/
    if (items.length === 0) {
      return _parseFromLinks(doc);
    }

    items.forEach(item => {
      try {
        const comp = _extractFromItem(item);
        if (comp && comp.name) comps.push(comp);
      } catch(e) {}
    });

    return comps.length > 0 ? comps : _parseFromLinks(doc);
  }

  // Extract competition data from a structured list item
  function _extractFromItem(item) {
    const links = item.querySelectorAll('a[href*="/competition/"]');
    if (links.length === 0) return null;

    const url = links[0]?.href || '';
    let name = '', city = '', dateStr = '', categories = '', weapons = [];

    // Extract text from links
    links.forEach(link => {
      const text = link.textContent.trim();
      if (text.match(/^(Tournoi|Championnat|Epreuve|Challenge|Coupe|Grand Prix|Circuit|Open|TREMPLIN|Stage)/i)) {
        name = text;
      } else if (text.match(/^Du \d/)) {
        dateStr = text;
      } else if (text.match(/^(M\d|SENIOR|V\d|M5|M7|M9|M11|M13|M15|M17|M20)/)) {
        categories = text;
      } else if (text.length <= 1 && 'EFSL'.includes(text)) {
        weapons.push(text);
      } else if (text.length > 1 && text === text.toUpperCase() && !text.match(/^(SENIOR|M\d|V\d)/) && text !== 'en savoir +') {
        city = text;
      }
    });

    if (!name && !city) return null;

    // Parse date
    const date = _parseFFEDate(dateStr);

    return {
      name: name || 'Compétition',
      city: city,
      date: date,
      dateStr: dateStr,
      categories: categories,
      weapons: weapons.join(', '),
      url: url,
      source: 'ffe'
    };
  }

  // Fallback parser: extract competitions from link patterns
  function _parseFromLinks(doc) {
    const comps = [];
    const seen = new Set();
    const allLinks = doc.querySelectorAll('a[href*="/competition/"]');
    let currentComp = null;

    allLinks.forEach(link => {
      const url = link.getAttribute('href') || '';
      const text = link.textContent.trim();
      if (!text || text === 'en savoir +') return;

      if (!seen.has(url) && text.match(/^(Tournoi|Championnat|Epreuve|Challenge|Coupe|Grand Prix|Circuit|Open|TREMPLIN|Stage)/i)) {
        if (currentComp && currentComp.name) comps.push(currentComp);
        currentComp = { name: text, city: '', date: null, dateStr: '', categories: '', weapons: [], url: url, source: 'ffe' };
        seen.add(url);
      } else if (currentComp) {
        if (text.match(/^Du \d/)) {
          currentComp.dateStr = text;
          currentComp.date = _parseFFEDate(text);
        } else if (text === text.toUpperCase() && text.length > 1 && !text.match(/^(M\d|SENIOR|V\d|en savoir)/) && !text.match(/^Du /)) {
          currentComp.city = text;
        } else if (text.match(/^(M\d|SENIOR|V\d)/)) {
          currentComp.categories = text;
        } else if (text.length === 1 && 'EFSL'.includes(text)) {
          currentComp.weapons.push(text);
        }
      }
    });
    if (currentComp && currentComp.name) comps.push(currentComp);

    // Clean up weapons array to string
    comps.forEach(c => {
      if (Array.isArray(c.weapons)) c.weapons = c.weapons.join(', ');
    });

    return comps;
  }

  // Parse FFE date strings like "Du 16 au 17 mai 2026"
  function _parseFFEDate(str) {
    if (!str) return null;
    const months = { 'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
      'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12' };

    // "Du 16 au 17 mai 2026" or "Du 23 au 23 mai 2026"
    const match = str.match(/(\d+)\s+(?:au\s+\d+\s+)?(\w+)\s+(\d{4})/i);
    if (!match) return null;

    const day = match[1].padStart(2, '0');
    const month = months[match[2].toLowerCase()] || '01';
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Fetch and parse FFE competitions (with proxy fallback)
  async function fetchCompetitions(prefs) {
    const url = buildUrl(prefs || { arme: 'foil', sexe: 'M', categorie: 'SENIOR' });

    for (const proxy of CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const html = await response.text();
        const results = parseCompetitions(html);
        if (results.length > 0) return results;
      } catch(e) {
        console.warn('FFE fetch failed with proxy:', proxy, e.message);
      }
    }
    return [];
  }

  // Get default preferences
  function defaultPrefs() {
    return { arme: 'foil', sexe: 'M', categorie: 'SENIOR', niveau: '' };
  }

  // Get saved preferences from DB
  async function getPrefs() {
    try {
      const setting = await DB.getSetting('ffe_prefs');
      return setting ? { ...defaultPrefs(), ...setting.value } : defaultPrefs();
    } catch(e) {
      return defaultPrefs();
    }
  }

  // Save preferences
  async function savePrefs(prefs) {
    await DB.saveSetting('ffe_prefs', prefs);
  }

  // Label helpers
  function armeLabel(code) {
    return { foil: 'Fleuret', epee: 'Épée', sabre: 'Sabre' }[code] || code;
  }

  function sexeLabel(code) {
    return { M: 'Hommes', F: 'Femmes' }[code] || code;
  }

  function weaponLetterToLabel(letter) {
    return { 'E': 'Épée', 'F': 'Fleuret', 'S': 'Sabre', 'L': 'Sabre laser' }[letter] || letter;
  }

  return { fetchCompetitions, getPrefs, savePrefs, defaultPrefs, armeLabel, sexeLabel, weaponLetterToLabel, buildUrl };
})();
