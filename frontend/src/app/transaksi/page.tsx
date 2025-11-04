// File: frontend/src/app/transaksi/page.tsx
"use client";

import { useState, useEffect } from "react";

const API_URL = 'http://localhost:5000/api';

interface Transaction {
  _id: string;
  createdAt: string; 
  total: number; // <-- DISESUAIKAN (dari totalPrice)
  paymentMethod: string;
  items: {
    name: string;
    quantity: number;
  }[];
}

const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const ContentHeader = ({ title }: { title: string }) => {
    return (
      <header className="content-header">
        <h1>{title}</h1>
      </header>
    );
};


export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions`);
      
      const transactionResponse = await res.json(); 
      if (!transactionResponse.success) {
        throw new Error(transactionResponse.message || 'Gagal mengambil data');
      }
      
      const data: Transaction[] = transactionResponse.data || []; 
      
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTransactions(sortedData);
      setFilteredTransactions(sortedData);
    } catch (error) {
      console.error("Gagal mengambil transaksi:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!dateFilter) {
      setFilteredTransactions(transactions); 
    } else {
      setFilteredTransactions(
        transactions.filter(tx => tx.createdAt && tx.createdAt.startsWith(dateFilter))
      );
    }
  }, [dateFilter, transactions]);
  
  const showDetail = (tx: Transaction) => {
    const itemsDetail = tx.items.map(item => 
        `\n- ${item.name} (x${item.quantity})`
    ).join('');
    
    // ===== PERBAIKAN 1 DI SINI =====
    alert(
        `--- Detail Transaksi ${tx._id.slice(-6)} ---` +
        `\nTotal: ${formatCurrency(tx.total)}` + // (Diganti dari tx.totalPrice)
        `\nWaktu: ${formatDate(tx.createdAt)}` +
        `\nMetode Bayar: ${tx.paymentMethod || 'N/A'}` +
        `\n\nItem dibeli:${itemsDetail}`
    );
  };

  return (
    <>
      <ContentHeader title="Histori Transaksi" />
      <div className="row">
        <div className="col-md-4 mb-3">
          <label htmlFor="filter-tanggal" className="form-label">Filter per Tanggal</label>
          <input 
            type="date" 
            className="form-control" 
            id="filter-tanggal"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="content-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle content-table">
            <thead className="table-light">
              <tr>
                <th>ID Transaksi</th>
                <th>Waktu</th>
                <th>Total Belanja</th>
                <th>Metode Bayar</th>
                <th>Item</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Memuat data...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center">Tidak ada transaksi.</td></tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{tx._id.slice(-6)}</td>
                    <td>{formatDate(tx.createdAt)}</td>
                    {/* ===== PERBAIKAN 2 DI SINI ===== */}
                    <td>{formatCurrency(tx.total)}</td> 
                    <td>
                      <span className={`badge ${tx.paymentMethod === 'Cash' ? 'bg-success' : 'bg-info'}`}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                    </td>
                    <td>
                      <button className="btn btn-info btn-sm" onClick={() => showDetail(tx)}>
                        <i className="bi bi-eye-fill"></i> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}