/* ============================================
   Touché! - IndexedDB Database Layer
   Offline-first storage for all app data
   ============================================ */

const DB = (() => {
  const DB_NAME = 'EscrimeTrackerDB';
  const DB_VERSION = 2;
  let db = null;

  // Generate unique ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Open / initialize database
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        // Lessons store
        if (!database.objectStoreNames.contains('lessons')) {
          const lessons = database.createObjectStore('lessons', { keyPath: 'id' });
          lessons.createIndex('date', 'date', { unique: false });
        }
        // Competitions store
        if (!database.objectStoreNames.contains('competitions')) {
          const comp = database.createObjectStore('competitions', { keyPath: 'id' });
          comp.createIndex('date', 'date', { unique: false });
        }
        // Bouts store
        if (!database.objectStoreNames.contains('bouts')) {
          const bouts = database.createObjectStore('bouts', { keyPath: 'id' });
          bouts.createIndex('competitionId', 'competitionId', { unique: false });
          bouts.createIndex('opponentId', 'opponentId', { unique: false });
          bouts.createIndex('date', 'date', { unique: false });
        }
        // Opponents store
        if (!database.objectStoreNames.contains('opponents')) {
          database.createObjectStore('opponents', { keyPath: 'id' });
        }
        // Videos store (for local video blobs)
        if (!database.objectStoreNames.contains('videos')) {
          database.createObjectStore('videos', { keyPath: 'id' });
        }
        // Photos store (for lesson photos) - v2
        if (!database.objectStoreNames.contains('photos')) {
          database.createObjectStore('photos', { keyPath: 'id' });
        }
        // Settings store - v2
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      request.onsuccess = (e) => { db = e.target.result; resolve(db); };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Generic CRUD helpers
  function _getStore(storeName, mode) {
    const tx = db.transaction(storeName, mode || 'readonly');
    return tx.objectStore(storeName);
  }

  function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = _getStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = _getStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function put(storeName, data) {
    return new Promise((resolve, reject) => {
      const store = _getStore(storeName, 'readwrite');
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function remove(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = _getStore(storeName, 'readwrite');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const store = _getStore(storeName);
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Convert Blob to base64 for export
  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // Convert base64 back to Blob
  function base64ToBlob(base64) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bytes = atob(parts[1]);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // Export all data as JSON
  async function exportAll() {
    const [lessons, competitions, bouts, opponents, videos, photos] = await Promise.all([
      getAll('lessons'), getAll('competitions'), getAll('bouts'),
      getAll('opponents'), getAll('videos'), getAll('photos')
    ]);
    // Convert video/photo blobs to base64
    const videosExport = [];
    for (const v of videos) {
      try {
        const b64 = await blobToBase64(v.blob);
        videosExport.push({ ...v, blob: b64 });
      } catch(e) { /* skip corrupted */ }
    }
    const photosExport = [];
    for (const p of photos) {
      try {
        const b64 = await blobToBase64(p.blob);
        photosExport.push({ ...p, blob: b64 });
      } catch(e) { /* skip corrupted */ }
    }
    return {
      version: 2,
      exportDate: new Date().toISOString(),
      app: 'Touché!',
      data: { lessons, competitions, bouts, opponents, videos: videosExport, photos: photosExport }
    };
  }

  // Import all data from JSON
  async function importAll(json) {
    const d = json.data;
    const stores = ['lessons', 'competitions', 'bouts', 'opponents', 'videos', 'photos'];
    // Clear all stores
    for (const s of stores) {
      const all = await getAll(s);
      for (const item of all) await remove(s, item.id || item.key);
    }
    // Import
    if (d.lessons) for (const item of d.lessons) await put('lessons', item);
    if (d.competitions) for (const item of d.competitions) await put('competitions', item);
    if (d.bouts) for (const item of d.bouts) await put('bouts', item);
    if (d.opponents) for (const item of d.opponents) await put('opponents', item);
    if (d.videos) for (const v of d.videos) {
      try { await put('videos', { ...v, blob: base64ToBlob(v.blob) }); } catch(e) {}
    }
    if (d.photos) for (const p of d.photos) {
      try { await put('photos', { ...p, blob: base64ToBlob(p.blob) }); } catch(e) {}
    }
  }

  // Public API
  return {
    uid,
    open,
    exportAll,
    importAll,
    // Lessons
    getLessons: () => getAll('lessons'),
    getLesson: (id) => getById('lessons', id),
    saveLesson: (data) => {
      if (!data.id) data.id = uid();
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      return put('lessons', data);
    },
    deleteLesson: (id) => remove('lessons', id),
    // Competitions
    getCompetitions: () => getAll('competitions'),
    getCompetition: (id) => getById('competitions', id),
    saveCompetition: (data) => {
      if (!data.id) data.id = uid();
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      return put('competitions', data);
    },
    deleteCompetition: (id) => remove('competitions', id),
    // Bouts
    getBouts: () => getAll('bouts'),
    getBout: (id) => getById('bouts', id),
    getBoutsByCompetition: (compId) => getByIndex('bouts', 'competitionId', compId),
    getBoutsByOpponent: (oppId) => getByIndex('bouts', 'opponentId', oppId),
    saveBout: (data) => {
      if (!data.id) data.id = uid();
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      return put('bouts', data);
    },
    deleteBout: (id) => remove('bouts', id),
    // Opponents
    getOpponents: () => getAll('opponents'),
    getOpponent: (id) => getById('opponents', id),
    saveOpponent: (data) => {
      if (!data.id) data.id = uid();
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      return put('opponents', data);
    },
    deleteOpponent: (id) => remove('opponents', id),
    // Videos (blob storage)
    getVideo: (id) => getById('videos', id),
    saveVideo: (data) => {
      if (!data.id) data.id = uid();
      return put('videos', data);
    },
    deleteVideo: (id) => remove('videos', id),
    // Photos (blob storage)
    getPhoto: (id) => getById('photos', id),
    savePhoto: (data) => {
      if (!data.id) data.id = uid();
      return put('photos', data);
    },
    deletePhoto: (id) => remove('photos', id),
    // Settings
    getSetting: (key) => getById('settings', key),
    saveSetting: (key, value) => put('settings', { key, value }),
  };
})();
