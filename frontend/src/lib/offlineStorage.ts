// frontend/src/lib/offlineStorage.ts

export interface OfflineTransaction {
  _id: string;
  items: {
    productId: string;
    nama: string;
    harga: number;
    quantity: number;
  }[];
  totalPrice: number;
  paymentMethod: string;
  paymentAmount: number;
  changeAmount: number;
  createdAt: string;
  status: 'pending' | 'synced';
  localOnly: boolean;
}

export interface LocalProduct {
  _id: string;
  nama: string;
  harga: number;
  stock: number;
  kategori: string;
  gambar?: string;
  lastSync?: string;
  localOnly?: boolean; // Produk yang dibuat saat offline
}

export interface SyncStatus {
  lastSync: string;
  pendingCount: number;
  isOnline: boolean;
  lastMenuSync: string; // Kapan terakhir sync menu
}

// ============= TRANSACTIONS =============

export const getPendingTransactions = (): OfflineTransaction[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('pendingTransactions');
  return data ? JSON.parse(data) : [];
};

export const saveOfflineTransaction = (transaction: OfflineTransaction): void => {
  const transactions = getPendingTransactions();
  transactions.push(transaction);
  localStorage.setItem('pendingTransactions', JSON.stringify(transactions));
  
  // Update sync status
  const status = getSyncStatus();
  status.pendingCount = transactions.filter(t => t.status === 'pending').length;
  updateSyncStatus(status);
};

export const updateTransactionStatus = (id: string, status: 'synced'): void => {
  const transactions = getPendingTransactions();
  const updated = transactions.map(t => 
    t._id === id ? { ...t, status, localOnly: false } : t
  );
  localStorage.setItem('pendingTransactions', JSON.stringify(updated));
};

export const removeSyncedTransactions = (): void => {
  const transactions = getPendingTransactions();
  const pending = transactions.filter(t => t.status === 'pending');
  localStorage.setItem('pendingTransactions', JSON.stringify(pending));
};

// ============= PRODUCTS/MENU =============

export const getLocalProducts = (): LocalProduct[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('localProducts');
  return data ? JSON.parse(data) : [];
};

export const saveLocalProducts = (products: LocalProduct[]): void => {
  localStorage.setItem('localProducts', JSON.stringify(products));
  
  // Update last sync time
  const status = getSyncStatus();
  status.lastMenuSync = new Date().toISOString();
  updateSyncStatus(status);
};

export const addLocalProduct = (product: Omit<LocalProduct, '_id'>): LocalProduct => {
  const products = getLocalProducts();
  const newProduct: LocalProduct = {
    ...product,
    _id: `temp_${Date.now()}`,
    localOnly: true,
    lastSync: new Date().toISOString()
  };
  products.push(newProduct);
  saveLocalProducts(products);
  return newProduct;
};

export const updateLocalProduct = (id: string, updates: Partial<LocalProduct>): void => {
  const products = getLocalProducts();
  const updated = products.map(p => 
    p._id === id ? { ...p, ...updates, lastSync: new Date().toISOString() } : p
  );
  saveLocalProducts(updated);
};

export const deleteLocalProduct = (id: string): void => {
  const products = getLocalProducts();
  const filtered = products.filter(p => p._id !== id);
  saveLocalProducts(filtered);
};

export const reduceLocalProductStock = (productId: string, quantity: number): void => {
  const products = getLocalProducts();
  const updated = products.map(p => 
    p._id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
  );
  saveLocalProducts(updated);
};

// ============= SYNC STATUS =============

export const getSyncStatus = (): SyncStatus => {
  if (typeof window === 'undefined') {
    return {
      lastSync: new Date().toISOString(),
      pendingCount: 0,
      isOnline: false,
      lastMenuSync: new Date().toISOString()
    };
  }
  
  const data = localStorage.getItem('syncStatus');
  return data ? JSON.parse(data) : {
    lastSync: new Date().toISOString(),
    pendingCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    lastMenuSync: new Date().toISOString()
  };
};

export const updateSyncStatus = (status: Partial<SyncStatus>): void => {
  const current = getSyncStatus();
  const updated = { ...current, ...status };
  localStorage.setItem('syncStatus', JSON.stringify(updated));
};

// ============= CACHE MANAGEMENT =============

export const clearAllCache = (): void => {
  localStorage.removeItem('pendingTransactions');
  localStorage.removeItem('localProducts');
  localStorage.removeItem('syncStatus');
};

export const getCacheSize = (): string => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return (total / 1024).toFixed(2) + ' KB';
};