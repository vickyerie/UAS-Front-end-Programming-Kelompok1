"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = "http://localhost:5000/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

const formatCurrency = (number: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const ContentHeader = ({ title }: { title: string }) => (
  <header className="content-header">
    <h1>{title}</h1>
  </header>
);

export default function KelolaMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any>(null);
  const [currentProduct, setCurrentProduct] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.min.js");
      const modalEl = document.getElementById("editProductModal");
      if (modalEl) {
        setEditModal(new bootstrap.Modal(modalEl));
      }
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      const productResponse = await res.json();
      if (!productResponse.success)
        throw new Error(productResponse.message || "Gagal mengambil data produk");
      setProducts(productResponse.data || []);
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      try {
        await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
        fetchProducts();
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    if (editModal) editModal.show();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const dataToSend = {
      ...currentProduct,
      price: parseFloat(currentProduct.price) || 0,
      stock: parseInt(currentProduct.stock) || 0,
    };

    try {
      await fetch(`${API_URL}/products/${currentProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      fetchProducts();
      if (editModal) editModal.hide();
    } catch (error) {
      console.error("Gagal mengupdate produk:", error);
    }
  };

  const handleModalInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (currentProduct) {
      const { name, value, type } = e.target;
      
      if (type === "number") {
        if (value === "") {
          setCurrentProduct({ ...currentProduct, [name]: "" });
        } else if (!isNaN(parseFloat(value))) {
          setCurrentProduct({ ...currentProduct, [name]: parseFloat(value) });
        }
      } else {
        setCurrentProduct({ ...currentProduct, [name]: value });
      }
    }
  };

  return (
    <>
      <ContentHeader title="Lihat & Kelola Menu" />

      <Link href="/menu" className="btn btn-outline-secondary mb-3">
        <i className="bi bi-arrow-left-circle-fill"></i> Kembali
      </Link>

      <div className="content-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Foto</th>
                <th>ID</th>
                <th>Nama Menu</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">Memuat data...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">Belum ada produk.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={product.image || "https://via.placeholder.com/100"}
                        alt={product.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </td>
                    <td>{product._id.slice(-6)}</td>
                    <td>{product.name}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {product.category}
                      </span>
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(product)}
                      >
                        <i className="bi bi-pencil-fill"></i> Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        <i className="bi bi-trash-fill"></i> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="editProductModal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Menu</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                {currentProduct && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="edit-name" className="form-label">Nama Menu</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-name"
                        name="name"
                        value={currentProduct.name}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-category" className="form-label">Kategori</label>
                      <select
                        className="form-select"
                        id="edit-category"
                        name="category"
                        value={currentProduct.category}
                        onChange={handleModalInputChange}
                        required
                      >
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Cemilan">Cemilan</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-price" className="form-label">Harga (Rp)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="edit-price"
                        name="price"
                        value={currentProduct.price ?? ""}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-stock" className="form-label">Stok</label>
                      <input
                        type="number"
                        className="form-control"
                        id="edit-stock"
                        name="stock"
                        value={currentProduct.stock ?? ""}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-image" className="form-label">URL Foto Menu</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-image"
                        name="image"
                        value={currentProduct.image || ""}
                        onChange={handleModalInputChange}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-save-fill"></i> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}