// Eigen foto's: opgeslagen in IndexedDB op dit apparaat. Er wordt nooit iets geüpload.

const DB_NAME = 'groteknut-fotos';
const DB_VERSION = 1;
let dbPromise = null;

function openDb() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('Foto’s bewaren wordt niet ondersteund in deze browser.'));
  dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' }).createIndex('activity', 'activity');
      if (!db.objectStoreNames.contains('full')) db.createObjectStore('full');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const asPromise = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const finished = (t) => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });

// activity-id -> [{ id, activity, created, url }], nieuwste eerst
const index = new Map();
const thumbUrls = new Map();

function addToIndex(meta) {
  const url = URL.createObjectURL(meta.thumb);
  thumbUrls.set(meta.id, url);
  const list = index.get(meta.activity) || [];
  list.push({ id: meta.id, activity: meta.activity, created: meta.created, url, note: meta.note || '' });
  list.sort((a, b) => b.created - a.created);
  index.set(meta.activity, list);
}

export async function loadPhotos() {
  try {
    const db = await openDb();
    const all = await asPromise(db.transaction('meta').objectStore('meta').getAll());
    index.clear();
    all.forEach(addToIndex);
    return all.length;
  } catch {
    return 0;
  }
}

export const photosFor = (activity) => index.get(activity) || [];
export const allPhotos = () => [...index.values()].flat().sort((a, b) => b.created - a.created);
export const photoCount = () => [...index.values()].reduce((n, l) => n + l.length, 0);

function readImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Deze foto kan niet gelezen worden.')); };
    img.src = url;
  });
}

async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* val terug op <img> */ }
  }
  return readImage(file);
}

function toJpeg(source, max, quality) {
  const w0 = source.naturalWidth || source.width;
  const h0 = source.naturalHeight || source.height;
  const scale = Math.min(1, max / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * scale));
  canvas.height = Math.max(1, Math.round(h0 * scale));
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Foto verwerken lukte niet.'))), 'image/jpeg', quality));
}

// Voegt foto's toe aan een idee. Geeft het aantal opgeslagen foto's terug.
export async function addPhotos(activity, files) {
  const db = await openDb();
  try { await navigator.storage?.persist?.(); } catch { /* niet erg */ }
  let n = 0;
  for (const file of files) {
    if (!file || !/^image\//.test(file.type || 'image/')) continue;
    const src = await decode(file);
    const [full, thumb] = [await toJpeg(src, 1600, 0.82), await toJpeg(src, 480, 0.72)];
    src.close?.();
    const meta = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, activity, created: Date.now(), thumb };
    const t = db.transaction(['meta', 'full'], 'readwrite');
    t.objectStore('meta').put(meta);
    t.objectStore('full').put(full, meta.id);
    await finished(t);
    addToIndex(meta);
    n++;
  }
  return n;
}

// Notitie bij een foto opslaan (bijv. wat je kind zei). Leeg = notitie weghalen.
export async function setPhotoNote(id, note) {
  const db = await openDb();
  const t = db.transaction('meta', 'readwrite');
  const store = t.objectStore('meta');
  const meta = await asPromise(store.get(id));
  if (!meta) return;
  meta.note = String(note || '').trim().slice(0, 300);
  store.put(meta);
  await finished(t);
  for (const list of index.values()) for (const p of list) if (p.id === id) p.note = meta.note;
}

export async function fullBlob(id) {
  const db = await openDb();
  return asPromise(db.transaction('full').objectStore('full').get(id));
}

export async function deletePhoto(id) {
  const db = await openDb();
  const t = db.transaction(['meta', 'full'], 'readwrite');
  t.objectStore('meta').delete(id);
  t.objectStore('full').delete(id);
  await finished(t);
  for (const [activity, list] of index) {
    const next = list.filter((p) => p.id !== id);
    if (next.length) index.set(activity, next); else index.delete(activity);
  }
  const url = thumbUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  thumbUrls.delete(id);
}
