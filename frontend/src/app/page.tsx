// File: frontend/src/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Pindahkan pengguna secara otomatis dari root ('/') 
  // ke halaman login ('/login')
  redirect('/login');
}