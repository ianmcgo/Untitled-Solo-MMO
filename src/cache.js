const CACHE_VER = "__PKGVER__";
const CACHE = { db: null, tried: false, max: { t: 24, i: 2 } };

function cacheOpen() {
  if (CACHE.db) return Promise.resolve(CACHE.db);
  if (CACHE.tried) return Promise.resolve(null);
  CACHE.tried = true;
  return new Promise(res => {
    try {
      const rq = indexedDB.open("leidanav_cache_v1", 1);
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore("blobs"); } catch (e) {} };
      rq.onsuccess = () => { CACHE.db = rq.result; cachePrune(); res(CACHE.db); };
      rq.onerror = rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
}

function cacheTx(mode, fn) {
  return cacheOpen().then(db => new Promise(res => {
    if (!db) { res(null); return; }
    try {
      const tx = db.transaction("blobs", mode), st = tx.objectStore("blobs");
      let out = null;
      fn(st, v => { out = v; });
      tx.oncomplete = () => res(out);
      tx.onerror = tx.onabort = () => res(null);
    } catch (e) { res(null); }
  }));
}

function cacheGet(key) {
  return cacheTx("readonly", (st, set) => { const r = st.get(key); r.onsuccess = () => set(r.result && r.result.v === CACHE_VER ? r.result : null); });
}

function cachePut(key, blob, meta) {
  return cacheTx("readwrite", st => { st.put({ v: CACHE_VER, t: Date.now(), blob, meta: meta || null }, key); });
}

function cachePrune() {
  const db = CACHE.db;
  if (!db) return;
  try {
    const tx = db.transaction("blobs", "readwrite"), st = tx.objectStore("blobs"), rows = [];
    const cur = st.openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) { rows.push({ k: c.key, t: c.value.t || 0, v: c.value.v, kind: String(c.key)[0] }); c.continue(); return; }
      for (const r of rows) if (r.v !== CACHE_VER) st.delete(r.k);
      for (const kind of Object.keys(CACHE.max)) {
        const mine = rows.filter(r => r.v === CACHE_VER && r.kind === kind).sort((a, b) => b.t - a.t);
        for (const r of mine.slice(CACHE.max[kind])) st.delete(r.k);
      }
    };
  } catch (e) {}
}

function cacheStoreCanvas(key, canvas, type, quality, meta) {
  try {
    canvas.toBlob(b => { if (b) cachePut(key, b, meta); }, type, quality);
  } catch (e) {}
}

function cacheImage(rec) {
  if (!rec || !rec.blob) return Promise.resolve(null);
  if (typeof createImageBitmap === "function") return createImageBitmap(rec.blob).catch(() => null);
  return Promise.resolve(null);
}

function cacheClear() {
  return cacheTx("readwrite", st => { st.clear(); });
}
