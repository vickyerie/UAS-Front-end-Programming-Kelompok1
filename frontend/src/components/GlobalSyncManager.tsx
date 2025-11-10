// frontend/src/app/components/GlobalSyncManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus'; // Pastikan path ini benar
import { 
  startAutoSync, 
  stopAutoSync, 
  manualSync 
} from '@/lib/syncManager'; // Pastikan path ini benar

export function GlobalSyncManager() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Mulai auto-sync periodik (misal 5 menit) saat aplikasi dimuat
  useEffect(() => {
    console.log('GlobalSyncManager dimuat, memulai auto-sync...');
    // Interval 300000ms = 5 menit. Ganti sesuai kebutuhan.
    startAutoSync(300000); 

    return () => {
      // Hentikan saat komponen di-unmount
      stopAutoSync(); 
    };
  }, []);

  // 2. Ini adalah pemicu UTAMA saat koneksi kembali online
  useEffect(() => {
    // Cek jika kita baru saja kembali online DAN kita tidak sedang sync
    if (isOnline && !isSyncing) {
      console.log('Koneksi kembali terdeteksi! Memulai sinkronisasi data...');
      setIsSyncing(true);
      
      manualSync()
        .then(result => {
          if (result.success) {
            console.log(`Sinkronisasi berhasil: ${result.syncedCount} transaksi terkirim.`);
            // Anda bisa tambahkan notifikasi "Toast" di sini
            // alert(`Sukses: ${result.syncedCount} transaksi disinkronkan`);
          } else {
            console.warn(`Sinkronisasi gagal: ${result.message}`);
            // alert(`Gagal sinkronisasi: ${result.message}`);
          }
        })
        .finally(() => {
          setIsSyncing(false); // Selesai sync, siap untuk sync berikutnya
        });
    } else if (!isOnline) {
       console.log('Koneksi terputus, sinkronisasi ditunda.');
    }
  }, [isOnline, isSyncing]); // Dijalankan setiap kali 'isOnline' berubah

  return null; // Komponen ini tidak me-render UI apapun
}