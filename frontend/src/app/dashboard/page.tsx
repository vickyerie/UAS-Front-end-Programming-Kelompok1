"use client";

import { useEffect, useState } from "react";

const ContentHeader = ({ title }: { title: string }) => {
    const [userEmail, setUserEmail] = useState("Loading...");
    useEffect(() => {
      const user = localStorage.getItem("loggedInUser");
      setUserEmail(user || "Tamu");
    }, []);
  
    const handleLogout = () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = '/login';
    };
  
    return (
      <header className="content-header">
        <h1>{title}</h1>
        <div className="header-actions">
          <div className="user-profile dropdown">
            <a href="#" className="d-flex align-items-center text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <img src="https://via.placeholder.com/40" alt="User" />
              <span id="user-display-email">{userEmail}</span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><a className="dropdown-item logout-link" href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </div>
        </div>
      </header>
    );
};

const API_URL = 'http://localhost:5000/api';

const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [popularMenu, setPopularMenu] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      
      const transRes = await fetch(`${API_URL}/transactions`);
      const transactionResponse = await transRes.json();
      const allTransactions = transactionResponse.data || []; 

      const prodRes = await fetch(`${API_URL}/products`);
      const productResponse = await prodRes.json(); 
      const allProducts = productResponse.data || [];
      setTotalProducts(allProducts.length || 0);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayTransactions = allTransactions.filter((tx: any) => 
        tx.createdAt && tx.createdAt.startsWith(todayStr)
      );

      const revenueToday = todayTransactions.reduce((sum: number, tx: any) => sum + tx.total, 0); 
      setTotalRevenue(revenueToday);
      
      setTotalOrders(todayTransactions.length);

      const itemCounts: { [key: string]: number } = {};
      todayTransactions.forEach((tx: any) => {
        tx.items.forEach((item: any) => { 
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });

      const sortedPopular = Object.entries(itemCounts)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => {
            const product = allProducts.find((p: any) => p.name === name);
            return { name, quantity, image: product?.image }; 
        });
      setPopularMenu(sortedPopular);

      const sortedRecent = [...allTransactions].reverse().slice(0, 5);
      setRecentOrders(sortedRecent);

    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <ContentHeader title="Dashboard" />

      <section className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="icon-circle bg-primary-soft"><i className="bi bi-cash-stack"></i></div>
              <div>
                <h6 className="card-title">Total Pendapatan (Hari Ini)</h6>
                <p className="card-text" id="total-revenue">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="icon-circle bg-success-soft"><i className="bi bi-receipt"></i></div>
              <div>
                <h6 className="card-title">Total Transaksi (Hari Ini)</h6>
                <p className="card-text" id="total-orders">{totalOrders}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="icon-circle bg-warning-soft"><i className="bi bi-archive-fill"></i></div>
              <div>
                <h6 className="card-title">Total Produk Terdaftar</h6>
                <p className="card-text" id="total-products">{totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="row">
        <div className="col-lg-7 mb-4">
          <div className="card list-card h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Menu Populer (Hari Ini)</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush" id="popular-menu-list">
                {popularMenu.length === 0 ? (
                    <li className="list-group-item text-muted">Belum ada penjualan hari ini.</li>
                ) : (
                    popularMenu.map((item) => (
                        <li key={item.name} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <img src={item.image || 'https://via.placeholder.com/40'} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} className="me-3" />
                                <span>{item.name}</span>
                            </div>
                            <span className="badge bg-primary rounded-pill">{item.quantity}x</span>
                        </li>
                    ))
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-lg-5 mb-4">
          <div className="card list-card h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Pesanan Terbaru</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush" id="recent-order-list">
                {recentOrders.length === 0 ? (
                    <li className="list-group-item text-muted">Belum ada transaksi.</li>
                ) : (
                    recentOrders.map((tx) => (
                        <li key={tx._id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span className="fw-bold">{tx._id.slice(-6)}</span>
                                <small className="text-muted d-block">{tx.items.length} item</small>
                            </div>
                            <span className="text-success fw-bold">{formatCurrency(tx.total)}</span>
                        </li>
                    ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}