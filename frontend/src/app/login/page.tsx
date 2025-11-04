// File: frontend/src/app/login/page.tsx (FINAL)
"use client"; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Asumsi URL Backend
const API_BASE_URL = 'http://localhost:5000/api/akun'; // Sesuaikan port 5000 jika beda

// ==========================================================
// KOMPONEN FORM LOGIN
// ==========================================================
const LoginForm = ({ onToggleView }: { onToggleView: () => void }) => {
  const [email, setEmail] = useState(''); // <-- DIUBAH DARI USERNAME
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // --- KODE ASLI SEKARANG AKTIF ---
      const res = await fetch(`${API_BASE_URL}/login`, { // URL sudah benar
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // <-- Mengirim 'email'
      });
      
      const data = await res.json(); // Ambil respons dari backend

      if (!res.ok) {
        throw new Error(data.message || 'Gagal login');
      }

      // Simpan info user (email & token) ke local storage
      localStorage.setItem('loggedInUser', data.email); 
      localStorage.setItem('authToken', data.token); // Simpan token
      
      // Arahkan ke dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      setError(error.message); // Tampilkan error dari backend
    }
  };

  return (
    <>
      <h2 className="text-center fw-bold mb-4">Login Kasir</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form id="login-form" onSubmit={handleLogin}>
        <div className="form-floating mb-3">
          <input
            type="email" // <-- DIUBAH ke 'email'
            className="form-control"
            id="email" // <-- DIUBAH DARI 'username'
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="email">Email</label> {/* <-- DIUBAH DARI 'Username' */}
        </div>
        <div className="form-floating mb-3">
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
        </div>
        <div className="d-grid">
          <button type="submit" className="btn btn-primary btn-lg fw-bold">Masuk</button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        Belum punya akun? 
        <a 
          href="#" 
          className="fw-bold text-decoration-none ms-1" 
          onClick={(e) => { e.preventDefault(); onToggleView(); }}
        >
          Daftar di sini
        </a>
      </p>
    </>
  );
};

// ==========================================================
// KOMPONEN FORM REGISTER
// ==========================================================
const RegisterForm = ({ onToggleView }: { onToggleView: () => void }) => {
  const [email, setEmail] = useState(''); // <-- DIUBAH DARI USERNAME
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok!');
      return;
    }

    try {
      // --- KODE ASLI SEKARANG AKTIF ---
      const res = await fetch(`${API_BASE_URL}/register`, { // URL sudah benar
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // <-- Mengirim 'email'
      });

      const data = await res.json(); // Ambil respons dari backend

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mendaftar');
      }

      setSuccess('Registrasi berhasil! Silakan login.');
      setTimeout(() => {
        onToggleView(); // Beralih ke tampilan login
      }, 2000);

    } catch (error: any) {
      setError(error.message); // Tampilkan error dari backend
    }
  };

  return (
    <>
      <h2 className="text-center fw-bold mb-4">Registrasi Akun</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      <form id="register-form" onSubmit={handleRegister}>
        <div className="form-floating mb-3">
          <input
            type="email" // <-- DIUBAH ke 'email'
            className="form-control"
            id="email" // <-- DIUBAH DARI 'username'
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="email">Email</label> {/* <-- DIUBAH DARI 'Username' */}
        </div>
        <div className="form-floating mb-3">
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
        </div>
        <div className="form-floating mb-3">
          <input
            type="password"
            className="form-control"
            id="confirm-password"
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label htmlFor="confirm-password">Konfirmasi Password</label>
        </div>
        <div className="d-grid">
          <button type="submit" className="btn btn-success btn-lg fw-bold">Daftar</button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        Sudah punya akun? 
        <a 
          href="#" 
          className="fw-bold text-decoration-none ms-1" 
          onClick={(e) => { e.preventDefault(); onToggleView(); }}
        >
          Login di sini
        </a>
      </p>
    </>
  );
};


// ==========================================================
// KOMPONEN UTAMA HALAMAN
// ==========================================================
export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="login-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                {isLoginView ? (
                  <LoginForm onToggleView={() => setIsLoginView(false)} />
                ) : (
                  <RegisterForm onToggleView={() => setIsLoginView(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}