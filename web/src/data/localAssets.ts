// 本地上传资产（模型 / 照片）的持久化：IndexedDB
// 说明：V1 为纯前端演示，数据存在浏览器；接后端后改为上传到服务端并返回 URL。

const DB_NAME = 'laomo-assets'
const DB_VERSION = 1
const STORE_MODEL = 'models'
const STORE_PHOTO = 'photos'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_MODEL)) db.createObjectStore(STORE_MODEL)
      if (!db.objectStoreNames.contains(STORE_PHOTO)) db.createObjectStore(STORE_PHOTO)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function put(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAll<T>(store: string): Promise<Record<string, T>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const out: Record<string, T> = {}
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).openCursor()
    req.onsuccess = () => {
      const cur = req.result
      if (cur) {
        out[String(cur.key)] = cur.value as T
        cur.continue()
      } else {
        resolve(out)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

async function del(store: string, key: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const saveModel = (id: string, file: Blob) => put(STORE_MODEL, id, file)
export const loadModels = () => getAll<Blob>(STORE_MODEL)
export const removeModel = (id: string) => del(STORE_MODEL, id)

export const savePhoto = (id: string, dataUrl: string) => put(STORE_PHOTO, id, dataUrl)
export const loadPhotos = () => getAll<string>(STORE_PHOTO)
export const removePhoto = (id: string) => del(STORE_PHOTO, id)
