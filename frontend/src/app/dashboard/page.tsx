'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  // Ini adalah "Protected Route" sederhana
  useEffect(() => {
    const token = localStorage.getItem('kasirToken');
    // Jika tidak ada token, tendang user kembali ke halaman login
    if (!token) {
      router.push('/login');
    }
  }, [router]); // 'router' ditambahkan ke dependency array

  return (
    <div className="container mt-5">
      <h1>Selamat Datang di Dashboard Kasir!</h1>
      <p>Ini adalah halaman utama Anda setelah berhasil login.</p>
      <p>Dari sini Anda bisa mulai mengelola menu dan pesanan.</p>
    </div>
  );
}