import { StoredFile } from '../types';

const DB_NAME = 'ALRobloxHubDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveFileToDB = async (file: File): Promise<StoredFile> => {
  const db = await openDB();
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  const storedFile: StoredFile & { content: Blob } = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadDate: Date.now(),
    extension: extension,
    content: file // Store the actual blob
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedFile);

    request.onsuccess = () => {
      // Return metadata only (without blob content to keep state light)
      const { content, ...metadata } = storedFile;
      resolve(metadata);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getFilesFromDB = async (): Promise<StoredFile[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Strip out the heavy blobs for the list view
      const results = request.result.map((item: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content, ...metadata } = item;
        return metadata as StoredFile;
      });
      // Sort by newest first
      resolve(results.sort((a, b) => b.uploadDate - a.uploadDate));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteFileFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const downloadFileFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result;
      if (result && result.content) {
        const url = URL.createObjectURL(result.content);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      } else {
        reject(new Error("File not found"));
      }
    };
    request.onerror = () => reject(request.error);
  });
};