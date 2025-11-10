// frontend/src/app/kasir/page.tsx
"use client";

import { useEffect, useState } from "react";
// --- MODIFIKASI: Tambahkan import yang diperlukan ---
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncMenuFromBackend } from "@/lib/syncManager";
import { 
  getLocalProducts, 
  saveOfflineTransaction, 
  reduceLocalProductStock,
  OfflineTransaction // Pastikan interface ini diekspor dari offlineStorage.ts
} from "@/lib/offlineStorage";
import { v4 as uuidv4 } from 'uuid'; // Install: npm install uuid @types/uuid

const API_URL = "http://localhost:5000";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  gambar: string;
}
interface CartItem extends Product {
  quantity: number;
}
// ... (Interface TransactionItem tidak terpakai, bisa dihapus) ...

const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

export default function KasirPage() {
  // --- BARU: Tambahkan hook status online & loading ---
  const isOnline = useOnlineStatus();
  // --- TAMBAHKAN STATE INI ---
  // State untuk melacak apakah komponen sudah "ter-mount" di klien
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Untuk loading awal
  const [isProcessing, setIsProcessing] = useState(false); // Untuk tombol bayar

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [currentCategory, setCurrentCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  const [qrisModal, setQrisModal] = useState<any>(null);
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [qrisTotal, setQrisTotal] = useState(0);
  
  useEffect(() => {
    // --- TAMBAHKAN BARIS INI ---
    // Saat useEffect berjalan, kita tahu ini 100% di browser.
    setIsClient(true);
    if (typeof window !== "undefined") {
      const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.min.js");
      const modalEl = document.getElementById('qrisModal');
      if (modalEl) {
        setQrisModal(new bootstrap.Modal(modalEl));
      }
    }
  }, []);

  // --- MODIFIKASI: Ganti fetchProducts menjadi loadAndSyncProducts ---
  const loadAndSyncProducts = async () => {
    setIsLoading(true);
    console.log('Memuat produk...');

    try {
      if (isOnline) {
        // Jika online, coba sinkronkan menu dari backend dulu
        console.log('Online, menyinkronkan menu dari backend...');
        await syncMenuFromBackend();
      } else {
        console.log('Offline, memuat menu dari cache lokal...');
      }

      // Selalu ambil data dari local storage (sumber kebenaran)
      const localData = getLocalProducts(); 
      
      // Format data dari local storage (nama, harga) ke format UI (name, price)
      const formattedData: Product[] = localData.map((p: any) => ({
        _id: p._id,
        name: p.nama, // 'nama' dari local storage
        price: parseFloat(p.harga) || 0, // 'harga' dari local storage
        stock: p.stock || 0,
        category: p.kategori || 'Makanan',
        gambar: p.gambar
      }));

      setProducts(formattedData);

      const uniqueCategories = ['Semua', ...new Set(formattedData.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Gagal mengambil/sinkronisasi produk:", error);
      // Jika gagal total, coba lagi muat dari lokal (backup)
      try {
        const localData = getLocalProducts();
        const formattedData: Product[] = localData.map((p: any) => ({ _id: p._id, name: p.nama, price: parseFloat(p.harga) || 0, stock: p.stock, category: p.kategori, gambar: p.gambar }));
        setProducts(formattedData);
        const uniqueCategories = ['Semua', ...new Set(formattedData.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (localError) {
        console.error("Gagal memuat dari cache lokal:", localError);
        alert("Gagal memuat data menu. Silakan periksa koneksi Anda dan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger load/sync saat komponen pertama kali dimuat
  useEffect(() => {
    loadAndSyncProducts();
  }, []); // Hanya dijalankan sekali saat mount

  // Trigger sync ulang saat kembali online
  useEffect(() => {
    if (isOnline) {
      console.log('Status berubah online, sinkronisasi ulang menu...');
      loadAndSyncProducts();
    }
  }, [isOnline]); // Dijalankan saat status 'isOnline' berubah

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalPrice(total);
    calculateChange(total, amountPaid);
  }, [cart, amountPaid]);

  const calculateChange = (total: number, paid: string) => {
    const paidAmount = parseFloat(paid) || 0;
    const newChange = paidAmount - total;
    setChange(newChange);
  };

  const addToCart = (product: Product) => {
    // Ambil data produk terbaru dari state (yang dari local storage)
    const productInStock = products.find(p => p._id === product._id);
    
    if (!productInStock || productInStock.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }
    
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
      // Pastikan kuantitas di keranjang tidak melebihi stok
      if (existingItem.quantity < productInStock.stock) {
        setCart(cart.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        alert('Stok produk tidak mencukupi!');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find(item => item._id === productId);
    if (existingItem) {
      if (existingItem.quantity > 1) {
        setCart(cart.map(item => 
          item._id === productId ? { ...item, quantity: item.quantity - 1 } : item
        ));
      } else {
        setCart(cart.filter(item => item._id !== productId));
      }
    }
  };

  // --- BARU: Fungsi helper untuk reset keranjang & update stok lokal ---
  const resetCartAndRefreshStock = () => {
    setCart([]);
    setAmountPaid('');
    setPaymentMethod('Cash');
    setChange(0);
    
    if (qrisModal) qrisModal.hide();

    // Muat ulang data produk dari local storage
    // untuk menampilkan stok yang baru (setelah dikurangi)
    loadAndSyncProducts(); 
  }

  // --- MODIFIKASI: Logika completeTransaction di-upgrade ---
  const completeTransaction = async (method: string) => {
    setIsProcessing(true); // Mulai proses

    const paidAmount = (method === 'QRIS') ? totalPrice : (parseFloat(amountPaid) || 0);
    const changeAmount = (method === 'QRIS') ? 0 : change;

    // 1. Siapkan data transaksi untuk backend
    const transactionData = {
      items: cart.map(item => ({
        productId: item._id, 
        nama: item.name,
        harga: item.price,
        quantity: item.quantity
      })),
      totalPrice: totalPrice,
      paymentAmount: paidAmount,
      changeAmount: changeAmount,
      paymentMethod: method
    };

    // 2. Siapkan data untuk disimpan di antrean offline (localStorage)
    //    Kita tambahkan _id sementara, status, dll.
    const offlineTxData: OfflineTransaction = {
      ...transactionData,
      _id: `temp_${uuidv4()}`, // ID unik sementara
      createdAt: new Date().toISOString(),
      status: 'pending',
      localOnly: true
    };

    // 3. Fungsi helper untuk menyimpan ke lokal
    const saveToOfflineQueue = () => {
      try {
        console.log('Menyimpan transaksi ke antrean offline...');
        saveOfflineTransaction(offlineTxData);
        // Langsung kurangi stok di local storage
        offlineTxData.items.forEach(item => {
          reduceLocalProductStock(item.productId, item.quantity);
        });
        alert(`Pesanan berhasil disimpan (Offline). Akan disinkronkan saat online.`);
        resetCartAndRefreshStock();
      } catch (e) {
        console.error("Gagal menyimpan ke antrean offline:", e);
        alert("CRITICAL: Gagal menyimpan pesanan di perangkat. Harap catat manual.");
      }
    };


    // 4. Logika Inti: Online atau Offline?
    if (isOnline) {
      // JIKA ONLINE: Coba kirim langsung ke server
      try {
        console.log('Online, mengirim transaksi langsung ke server...');
        
        // Endpoint ini /api/transactions BUKAN /api/sync/transactions
        // Ini adalah endpoint untuk 1 transaksi baru
        const res = await fetch(`${API_URL}/api/transactions`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData), // Kirim data standar
        });

        if (!res.ok) {
          // Jika server menolak (misal: stok habis di server), anggap gagal
          const errorData = await res.json();
          throw new Error(errorData.message || 'Server menolak transaksi'); 
        }

        // Jika berhasil terkirim online
        alert(`Pembayaran ${method} berhasil (Online)!`);
        resetCartAndRefreshStock(); // Reset keranjang & update stok

      } catch (error: any) {
        // JIKA GAGAL (misal: internet tiba-tiba putus, server down)
        console.warn(`Gagal mengirim online, beralih ke antrean offline: ${error.message}`);
        // Gagal? Jangan khawatir, simpan ke antrean offline
        saveToOfflineQueue();
      }
    } else {
      // JIKA OFFLINE: Langsung simpan ke antrean
      console.log('Offline, menyimpan transaksi ke antrean...');
      saveToOfflineQueue();
    }
    
    setIsProcessing(false); // Selesai proses
  };

  const handleProcessPayment = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
  }
    if (isProcessing) return; // Mencegah klik ganda

    if (paymentMethod === 'Cash') {
      const paidAmount = parseFloat(amountPaid) || 0;
      if (paidAmount < totalPrice) {
        alert('Jumlah bayar kurang!');
        return;
      }
      completeTransaction('Cash');

    } else if (paymentMethod === 'QRIS') {
      // Cek jika offline, QRIS mungkin tidak bisa (tergantung sistem Anda)
      // Untuk simulasi ini, kita anggap QRIS bisa offline (kasir konfirmasi manual)
      if (!isOnline) {
        alert("Mode Offline: Simulasi QRIS akan langsung dikonfirmasi.");
        completeTransaction('QRIS');
        return;
      }
      
      // Logika QRIS online Anda
      const qrData = `SIMULASI_BAYAR_KE_KANTIN_SEBESAR_${totalPrice}`;
      setQrisImage(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`);
      setQrisTotal(totalPrice);
      if (qrisModal) qrisModal.show();
    }
  };

  const filteredProducts = products.filter(p => 
    p.stock > 0 &&
    (currentCategory === 'Semua' || p.category === currentCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="pos-container cashier-container" style={{ padding: '2rem' }}>
      
      <div className="product-pane">
        <header className="content-header" style={{ marginBottom: '1rem', padding: 0 }}>
          <h1>Pilih Menu</h1>
          {/* --- MODIFIKASI BAGIAN INI --- */}
          <div>
            Status: {isClient ? ( // Cek apakah sudah di klien
              isOnline ? 
                <span className="badge bg-success">Online</span> : 
                <span className="badge bg-danger">Offline</span>
            ) : (
              // Tampilkan ini saat render di server (atau sebelum mount)
              <span className="badge bg-secondary">...</span> 
            )}
          </div>
          {/* --- AKHIR MODIFIKASI --- */}
          <div className="header-actions">
            <input 
              type="text" 
              className="form-control" 
              id="search-product" 
              placeholder="Cari menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div id="category-tabs" className="mb-3">
          {categories.map(category => (
            <button 
              key={category} 
              className={`btn btn-outline-primary me-2 mb-2 category-btn ${currentCategory === category ? 'active' : ''}`}
              onClick={() => setCurrentCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="row product-grid" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {/* --- BARU: Indikator Loading --- */}
          {isLoading ? (
            <p className="text-center text-muted col-12">Memuat menu...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted col-12">Produk tidak ditemukan.</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id} className="col-lg-4 col-md-6 col-sm-6 col-6 mb-4" onClick={() => addToCart(product)}>
                <div className="card h-100 product-item shadow-sm border-0">
                  <img 
                    src={product.gambar || 'https://via.placeholder.com/150'} 
                    className="card-img-top"
                    alt={product.name} 
                    style={{ height: '150px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column p-3">
                    <h5 className="card-title fs-6 fw-bold mb-1">{product.name}</h5>
                    <p className="card-text fw-bold text-primary mb-2">{formatCurrency(product.price)}</p>
                    <small className="text-muted mt-auto">Stok: {product.stock}</small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Kolom Keranjang (Kanan) */}
      <aside className="cart-pane" style={{ height: 'calc(100vh - 4rem)' }}>
        <h3 className="fw-bold mb-3">Detail Pesanan</h3>
        
        <ul className="list-group list-group-flush" id="cart-items">
          {cart.length === 0 ? (
            <li className="list-group-item text-center text-muted">Keranjang kosong</li>
          ) : (
            cart.map(item => (
              <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <div className="fw-bold">{item.name}</div>
                  <small className="text-muted">{formatCurrency(item.price)} x {item.quantity}</small>
                </div>
                <div className="d-flex align-items-center">
                  <span className="fw-bold me-3">{formatCurrency(item.price * item.quantity)}</span>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeFromCart(item._id)}
                  >
                    <i className="bi bi-dash-circle"></i>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
        
        <div className="cart-summary">
          <div className="d-flex justify-content-between align-items-center mb-3 pt-3 border-top">
            <h4 className="fw-bold mb-0">Total:</h4>
            <h4 className="fw-bold text-primary mb-0" id="total-price">{formatCurrency(totalPrice)}</h4>
          </div>
          
          <div className="mb-3">
            <label htmlFor="payment-method" className="form-label fw-bold">Metode Pembayaran</label>
            <select 
              className="form-select" 
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          {paymentMethod === 'Cash' && (
            <>
              <div className="mb-3">
                <label htmlFor="amount-paid" className="form-label fw-bold">Jumlah Bayar</label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="amount-paid" 
                  placeholder="Masukkan jumlah..."
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>
              <div className="alert alert-info">
                <strong>Kembalian:</strong> <span id="change-amount">{formatCurrency(change)}</span>
              </div>
            </>
          )}

          <div className="d-grid mt-3">
            <button 
              className="btn btn-primary btn-lg fw-bold" 
              id="btn-process-payment"
              onClick={handleProcessPayment}
              disabled={isProcessing || isLoading || cart.length === 0} 
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span> Memproses...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill"></i> Proses Pembayaran
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Modal QRIS */}
      <div className="modal fade" id="qrisModal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Pembayaran QRIS</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body text-center">
              <p>Silakan scan QR code di bawah ini untuk membayar:</p>
              <h3 className="fw-bold text-primary">{formatCurrency(qrisTotal)}</h3>
              {qrisImage && (
                <img 
                  src={qrisImage} 
                  id="qris-image" 
                  className="img-fluid my-3" 
                  alt="QRIS Code" 
                  style={{ width: '250px', height: '250px' }} 
                />
              )}
              <p className="text-muted small">Ini adalah simulasi. QR code ini tidak terhubung dengan pembayaran nyata.</p>
            </div>
            <div className="modal-footer d-grid">
              <button 
                type="button" 
                className="btn btn-success" 
                id="btn-confirm-qris"
                onClick={() => completeTransaction('QRIS')}
              >
                <i className="bi bi-check-circle-fill"></i> Konfirmasi Pembayaran (Simulasi)
              </button>
              <button type="button" className="btn btn-secondary mt-2" data-bs-dismiss="modal">Batal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}