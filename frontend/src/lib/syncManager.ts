// frontend/src/lib/syncManager.ts

import {
  getPendingTransactions,
  updateTransactionStatus,
  removeSyncedTransactions,
  updateSyncStatus,
  getLocalProducts,
  saveLocalProducts,
  getSyncStatus,
  addLocalProduct,
  updateLocalProduct,
  deleteLocalProduct
} from './offlineStorage';

const API_URL = 'http://localhost:5000/api';

// ============= SYNC MENU FROM BACKEND =============

export const syncMenuFromBackend = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/menu`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) return false;

    const backendProducts = await response.json();
    const localProducts = getLocalProducts();

    // Gabungkan produk dari backend dengan produk lokal yang belum ter-sync
    const localOnlyProducts = localProducts.filter(p => p.localOnly);
    const mergedProducts = [
      ...backendProducts.map((p: any) => ({
        _id: p._id,
        nama: p.nama,
        harga: p.harga,
        stock: p.stock || 0,
        kategori: p.kategori || 'Lainnya',
        gambar: p.gambar,
        localOnly: false,
        lastSync: new Date().toISOString()
      })),
      ...localOnlyProducts
    ];

    saveLocalProducts(mergedProducts);
    console.log('✅ Menu synced from backend:', mergedProducts.length, 'items');
    return true;
  } catch (error) {
    console.error('❌ Failed to sync menu from backend:', error);
    return false;
  }
};

// ============= SYNC LOCAL PRODUCTS TO BACKEND =============

export const syncLocalProductsToBackend = async (): Promise<boolean> => {
  try {
    const localProducts = getLocalProducts();
    const localOnlyProducts = localProducts.filter(p => p.localOnly);

    if (localOnlyProducts.length === 0) {
      console.log('✅ No local products to sync');
      return true;
    }

    // Sync setiap produk lokal ke backend
    const results = await Promise.allSettled(
      localOnlyProducts.map(async (product) => {
        const response = await fetch(`${API_URL}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: product.nama,
            harga: product.harga,
            stock: product.stock,
            kategori: product.kategori,
            gambar: product.gambar
          })
        });

        if (!response.ok) throw new Error('Failed to sync product');

        const backendProduct = await response.json();
        
        // Update produk lokal dengan ID dari backend
        updateLocalProduct(product._id, {
          _id: backendProduct._id,
          localOnly: false
        });

        return backendProduct;
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Synced ${successCount}/${localOnlyProducts.length} local products to backend`);
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ Failed to sync local products:', error);
    return false;
  }
};

// ============= SYNC TRANSACTIONS TO BACKEND =============

export const syncTransactionsToBackend = async (): Promise<{
  success: boolean;
  syncedCount: number;
}> => {
  try {
    const pending = getPendingTransactions().filter(t => t.status === 'pending');

    if (pending.length === 0) {
      // --- TAMBAHAN KECIL: Log agar jelas ---
      console.log('Tidak ada transaksi tertunda untuk disinkronkan.');
      return { success: true, syncedCount: 0 };
    }

    // --- TAMBAHAN: Log apa yang akan dikirim ---
    console.log(`Mengirim ${pending.length} transaksi ke server...`);

    const response = await fetch(`${API_URL}/sync/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: pending })
    });

    if (!response.ok) {
      throw new Error('Sync failed with server response: ' + response.statusText);
    }

    const result = await response.json();
    console.log('Server response:', result);

    // Update status transaksi yang berhasil
    result.results.forEach((r: any) => {
      if (r.success) {
        // --- PERBAIKAN KRITIS ---
        // Ganti 'r.localId' menjadi 'r.tempId' agar cocok dengan controller
        updateTransactionStatus(r.tempId, 'synced'); 
      } else {
        // --- TAMBAHAN: Log error per transaksi ---
        console.warn(`Gagal sinkronisasi ${r.tempId}: ${r.error}`);
        // Transaksi yang gagal akan tetap berstatus 'pending' 
        // dan dicoba lagi di sinkronisasi berikutnya
      }
    });

    // Hapus transaksi yang sudah synced
    removeSyncedTransactions();

    // Update sync status
    const newPendingCount = getPendingTransactions().filter(t => t.status === 'pending').length;
    updateSyncStatus({
      lastSync: new Date().toISOString(),
      pendingCount: newPendingCount, // Hitung ulang jumlah yang pending
      isOnline: true,
  });

    console.log(`✅ Synced ${result.syncedCount}/${pending.length} transactions. Sisa pending: ${newPendingCount}`);

    return {
      success: true,
      syncedCount: result.syncedCount
    };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    // --- TAMBAHAN: Update status jika gagal total ---
    updateSyncStatus({ isOnline: false }); 
    return { success: false, syncedCount: 0 };
  }
};

// ============= AUTO SYNC MANAGER =============

let syncInterval: NodeJS.Timeout | null = null;

export const startAutoSync = (intervalMs: number = 30000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // --- TAMBAHAN: Jalankan manual sync sekali saat start ---
  console.log('Memulai auto-sync... Menjalankan sinkronisasi awal.');
  manualSync(); // Jalankan sekali saat aplikasi dimuat

  console.log('🔄 Auto-sync started (every', intervalMs / 1000, 'seconds)');

  syncInterval = setInterval(async () => {
    // --- MODIFIKASI: Gunakan navigator.onLine ---
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('⚠️ Offline - skipping sync');
      updateSyncStatus({ isOnline: false });
      return;
    }

    console.log('🔄 Running auto-sync...');
    updateSyncStatus({ isOnline: true });

    // --- MODIFIKASI: Panggil manualSync saja ---
    // manualSync sudah berisi semua logika
    await manualSync(); 

  }, intervalMs);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('🛑 Auto-sync stopped');
  }
};

// ============= MANUAL SYNC =============

export const manualSync = async (): Promise<{
  success: boolean;
  message: string;
  syncedCount: number;
}> => {
  // --- MODIFIKASI: Gunakan navigator.onLine ---
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      message: 'Tidak ada koneksi internet',
      syncedCount: 0
    };
  }

  try {
    console.log('🔄 Memulai manual sync...');
    // Sync menu dari backend
    await syncMenuFromBackend();
    
    // Sync produk lokal ke backend (jika ada)
    await syncLocalProductsToBackend();

    // Sync transaksi ke backend
    const transactionResult = await syncTransactionsToBackend();
    console.log('🔄 Manual sync selesai.');

    if (transactionResult.success) {
      return {
        success: true,
        message: `Berhasil sinkronisasi ${transactionResult.syncedCount} transaksi`,
        syncedCount: transactionResult.syncedCount
      };
    } else {
      return {
        success: false,
        message: 'Gagal sinkronisasi transaksi',
        syncedCount: 0
      };
    }
  } catch (error: any) {
    console.error('❌ Error saat manual sync:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat sinkronisasi',
      syncedCount: 0
    };
  }
};