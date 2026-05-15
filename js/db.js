/* ============================================
   EscrimeTracker - IndexedDB Database Layer
   Offline-first storage for all app data
   ============================================ */

const DB = (() => {
  const DB_NAME = 'EscrimeTrackerDB';
  const DB_VERSION = 1;
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

  // Public API
  return {
    uid,
    open,
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
  };
})();
