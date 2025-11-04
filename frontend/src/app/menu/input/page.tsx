// File: frontend/src/app/menu/input/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

// URL Backend
const API_URL = 'http://localhost:5000/api';

// Import komponen Header
const ContentHeader = ({ title }: { title: string }) => {
    return (
      <header className="content-header">
        <h1>{title}</h1>
      </header>
    );
};

export default function InputMenuPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Kirim data ke backend sesuai model 'product.model.js'
    const newProduct = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (!res.ok) {
        throw new Error('Gagal menambahkan produk');
      }

      // Reset form dan tampilkan pesan sukses
      setMessage({ type: 'success', text: 'Menu baru berhasil ditambahkan!' });
      setName('');
      setCategory('');
      setPrice('');
      setStock('');
      setImage('');
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Terjadi kesalahan' });
    }
  };

  return (
    <>
      <ContentHeader title="Input Menu Baru" />
      <Link href="/menu" className="btn btn-outline-secondary mb-3">
        <i className="bi bi-arrow-left-circle-fill"></i> Kembali
      </Link>

      <div className="content-card">
        {message.text && (
          <div className={`alert alert-${message.type}`} role="alert">
            {message.text}
          </div>
        )}
        <form id="form-tambah-produk" onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="nama-produk" className="form-label">Nama Menu</label>
              <input 
                type="text" 
                className="form-control" 
                id="nama-produk" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="kategori-produk" className="form-label">Kategori</label>
              <select 
                className="form-select" 
                id="kategori-produk" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Pilih Kategori...</option>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Cemilan">Cemilan</option>
                {/* Tambahkan kategori lain jika perlu */}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="harga-produk" className="form-label">Harga (Rp)</label>
              <input 
                type="number" 
                className="form-control" 
                id="harga-produk" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="stok-produk" className="form-label">Stok Awal</label>
              <input 
                type="number" 
                className="form-control" 
                id="stok-produk" 
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="foto-produk" className="form-label">URL Foto Menu (Opsional)</label>
            <input 
              type="text" 
              className="form-control" 
              id="foto-produk" 
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary fw-bold">
            <i className="bi bi-save-fill"></i> Simpan Menu Baru
          </button>
        </form>
      </div>
    </>
  );
}