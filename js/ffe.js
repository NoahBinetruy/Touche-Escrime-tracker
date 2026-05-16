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

  const REGIONS = [
    {"v":"12","l":"AUVERGNE RHONE ALPES"},{"v":"13","l":"BOURGOGNE FRANCHE COMTE"},{"v":"14","l":"BRETAGNE"},
    {"v":"15","l":"CENTRE VAL DE LOIRE"},{"v":"16","l":"CORSE"},{"v":"17","l":"FFE"},{"v":"18","l":"GRAND EST"},
    {"v":"19","l":"GUADELOUPE"},{"v":"20","l":"GUYANE"},{"v":"21","l":"HAUTS DE FRANCE"},{"v":"23","l":"ILE DE FRANCE"},
    {"v":"25","l":"LA REUNION"},{"v":"26","l":"MARTINIQUE"},{"v":"27","l":"NORMANDIE"},{"v":"28","l":"NOUVELLE AQUITAINE"},
    {"v":"29","l":"NOUVELLE CALEDONIE"},{"v":"30","l":"OCCITANIE"},{"v":"32","l":"PAYS DE LA LOIRE"},{"v":"31","l":"REGION SUD"}
  ];

  const DEPARTEMENTS = [
    {"v":"128","l":"63 Puy-de-Dôme"},{"v":"74","l":"ADE Aube"},{"v":"66","l":"Aisne"},{"v":"67","l":"Allier"},
    {"v":"68","l":"Alpes de Hautes-Provence"},{"v":"70","l":"Alpes-Maritimes"},{"v":"72","l":"Ardennes"},
    {"v":"73","l":"Ariège"},{"v":"105","l":"Association Escrime Landes 40"},{"v":"75","l":"Aude"},{"v":"76","l":"Aveyron"},
    {"v":"77","l":"Bouches-du-Rhône"},{"v":"132","l":"CD 67 Bas-Rhin"},{"v":"78","l":"Calvados"},{"v":"79","l":"Cantal"},
    {"v":"80","l":"Charente"},{"v":"81","l":"Charente-Maritime"},{"v":"82","l":"Cher"},{"v":"71","l":"Comité Bi-Départemental Ardèche Drôme"},
    {"v":"89","l":"Comité Bi-Départemental Drôme Ardèche"},{"v":"65","l":"Comité Départemental d'Escrime de l'Ain"},
    {"v":"87","l":"Comité Départemental d'Escrime de la Dordogne"},{"v":"127","l":"Comité Départemental d'Escrime du Pas-de-Calais"},
    {"v":"148","l":"Comité Départemental d'Escrime du Var"},{"v":"112","l":"Comité Départemental de Lot-et-Garonne"},
    {"v":"153","l":"Comité Départemental des Vosges"},{"v":"92","l":"Comité départemental d'escrime Finistère"},
    {"v":"88","l":"Comité départemental d'escrime du Doubs"},{"v":"124","l":"Comité départemental d'escrime du Nord"},
    {"v":"83","l":"Corrèze"},{"v":"93","l":"Corse du Sud"},{"v":"86","l":"Creuse"},{"v":"84","l":"Côte-d'Or"},{"v":"85","l":"Côtes d'Armor"},
    {"v":"144","l":"Deux-Sèvres"},{"v":"156","l":"Essonne"},{"v":"90","l":"Eure"},{"v":"91","l":"Eure-et-Loir"},{"v":"168","l":"FFE"},
    {"v":"95","l":"Gard"},{"v":"97","l":"Gers"},{"v":"98","l":"Gironde"},{"v":"162","l":"Guadeloupe"},{"v":"164","l":"Guyane"},
    {"v":"133","l":"Haut-Rhin"},{"v":"94","l":"Haute Corse"},{"v":"96","l":"Haute-Garonne"},{"v":"108","l":"Haute-Loire"},
    {"v":"117","l":"Haute-Marne"},{"v":"139","l":"Haute-Savoie"},{"v":"135","l":"Haute-Saône"},{"v":"152","l":"Haute-Vienne"},
    {"v":"69","l":"Hautes-Alpes"},{"v":"130","l":"Hautes-Pyrénées"},{"v":"157","l":"Hauts-de-Seine"},{"v":"99","l":"Hérault - Lozère"},
    {"v":"100","l":"Ille-et-Vilaine"},{"v":"101","l":"Indre"},{"v":"102","l":"Indre-et-Loire"},{"v":"103","l":"Isère"},
    {"v":"104","l":"Jura"},{"v":"165","l":"La Réunion"},{"v":"106","l":"Loir-et-Cher"},{"v":"107","l":"Loire"},
    {"v":"109","l":"Loire-Atlantique"},{"v":"111","l":"Lot"},{"v":"113","l":"Lozère"},{"v":"114","l":"Maine-et-Loire"},
    {"v":"115","l":"Manche"},{"v":"116","l":"Marne"},{"v":"163","l":"Martinique"},{"v":"118","l":"Mayenne"},
    {"v":"119","l":"Meurthe-et-Moselle"},{"v":"120","l":"Meuse"},{"v":"161","l":"Monaco"},{"v":"121","l":"Morbihan"},
    {"v":"122","l":"Moselle"},{"v":"123","l":"Nièvre"},{"v":"167","l":"Nouvelle Calédonie"},{"v":"125","l":"Oise"},
    {"v":"126","l":"Orne"},{"v":"140","l":"Paris"},{"v":"166","l":"Polynésie Française"},{"v":"129","l":"Pyrénées-Atlantiques"},
    {"v":"131","l":"Pyrénées-Orientales"},{"v":"134","l":"RHONE METROPOLE 69"},{"v":"137","l":"Sarthe"},{"v":"138","l":"Savoie"},
    {"v":"136","l":"Saône-et-Loire"},{"v":"141","l":"Seine-Maritime"},{"v":"158","l":"Seine-Saint-Denis"},{"v":"142","l":"Seine-et-Marne"},
    {"v":"145","l":"Somme"},{"v":"146","l":"Tarn"},{"v":"147","l":"Tarn-et-Garonne"},{"v":"155","l":"Territoire-de-Belfort"},
    {"v":"159","l":"VAL DE MARNE"},{"v":"160","l":"Val-d'Oise"},{"v":"149","l":"Vaucluse"},{"v":"150","l":"Vendée"},
    {"v":"151","l":"Vienne"},{"v":"154","l":"Yonne"},{"v":"143","l":"Yvelines"},{"v":"110","l":"loiret"}
  ].sort((a, b) => a.l.localeCompare(b.l));

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
    params.set('regions', prefs.region || '');
    params.set('departements', prefs.departement || '');
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

  function _resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'https://www.ffescrime.fr' + (url.startsWith('/') ? '' : '/') + url;
  }

  // Extract competition data from a structured list item
  function _extractFromItem(item) {
    const links = item.querySelectorAll('a[href*="/competition/"]');
    if (links.length === 0) return null;

    const rawUrl = links[0].getAttribute('href') || '';
    const url = _resolveUrl(rawUrl);
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
      const rawUrl = link.getAttribute('href') || '';
      const url = _resolveUrl(rawUrl);
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

  // Fetch and parse FFE competitions (with proxy fallback and multi-level support)
  async function fetchCompetitions(prefs) {
    const rawPrefs = prefs || defaultPrefs();
    let niveaux = Array.isArray(rawPrefs.niveau) ? rawPrefs.niveau : [rawPrefs.niveau];
    if (niveaux.length === 0) niveaux = [''];

    const fetchLevel = async (niveauStr) => {
      // Setup correct filters for the specific level
      const levelPrefs = { ...rawPrefs, niveau: niveauStr };
      if (niveauStr === '2') { // Départemental (was 4)
        levelPrefs.region = ''; // ignore region
      } else if (niveauStr === '11') { // Régional (was 3)
        levelPrefs.departement = ''; // ignore department
      } else if (niveauStr === '8' || niveauStr === '1') { // National (was 2) / Inter
        // National and international competitions are nationwide, so we clear both region and dept filters
        levelPrefs.region = '';
        levelPrefs.departement = ''; 
      }

      const url = buildUrl(levelPrefs);
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyUrl = proxy + encodeURIComponent(url);
          const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const html = await response.text();
          const results = parseCompetitions(html);
          if (results.length > 0) return results;
          // If 0 results but HTTP 200, don't try other proxies for this level
          return [];
        } catch(e) {
          console.warn('FFE fetch failed with proxy:', proxy, e.message);
        }
      }
      return [];
    };

    // Fetch all checked levels in parallel
    const allResults = await Promise.all(niveaux.map(lvl => fetchLevel(lvl)));
    const merged = allResults.flat();
    
    // Deduplicate by URL
    const uniqueComps = [];
    const seen = new Set();
    for (const c of merged) {
      if (!seen.has(c.url)) {
        seen.add(c.url);
        uniqueComps.push(c);
      }
    }

    // Sort by date ascending
    uniqueComps.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

    return uniqueComps;
  }

  // Get default preferences
  function defaultPrefs() {
    return { arme: 'foil', sexe: 'M', categorie: 'SENIOR', niveau: '', region: '', departement: '' };
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

  return { fetchCompetitions, getPrefs, savePrefs, defaultPrefs, armeLabel, sexeLabel, weaponLetterToLabel, buildUrl, REGIONS, DEPARTEMENTS };
})();
