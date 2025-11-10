/** @type {import('next').NextConfig} */

// 1. Import 'withPWA'
const withPWA = require('next-pwa')({
  dest: 'public',         // Ini akan membuat file service worker (sw.js) di folder public
  register: true,       // Akan otomatis mendaftarkan service worker
  skipWaiting: true,    // Langsung aktifkan service worker baru tanpa menunggu
  disable: process.env.NODE_ENV === 'development', // PENTING: Nonaktifkan PWA di mode 'dev'
});

// 2. Buat konfigurasi Next.js Anda
const nextConfig = {
  // reactStrictMode: true, // (Anda bisa tambahkan konfigurasi Next.js lain di sini)
};

// 3. Bungkus 'nextConfig' dengan 'withPWA'
module.exports = withPWA(nextConfig);