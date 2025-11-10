"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

interface Product {
  _id: string;
  nama: string;
  harga: number;
  stock: number;
  category: string;
  gambar: string;
}

const formatCurrency = (number: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);

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
  const [newFileGambar, setNewFileGambar] = useState<File | null>(null);
  const router = useRouter();

  // 🔹 Bootstrap Modal init
  useEffect(() => {
    if (typeof window !== "undefined") {
      const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.min.js");
      const modalEl = document.getElementById("editProductModal");
      if (modalEl) setEditModal(new bootstrap.Modal(modalEl));
    }
  }, []);

  // 🔹 Fetch Data Produk dari Backend
const fetchProducts = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/menu`);
    const response = await res.json();

    let dataProduk;

    // Cek apakah backend return { data: [...] }
    if (response && Array.isArray(response.data)) {
      dataProduk = response.data;
    }
    // Atau return langsung array tanpa property 'data'
    else if (Array.isArray(response)) {
      dataProduk = response;
    } else {
      throw new Error(response.message || "Format data produk tidak valid");
    }

    const parseHarga = (value: string | number): number => {
      if (typeof value === "number") return value;
      return parseInt(value.replace(/\./g, ""), 10) || 0;
};

    // Format ulang untuk tampilan
    const formatted = dataProduk.map((p: any) => ({
      _id: p._id,
      nama: p.nama,
      harga: parseHarga(p.harga),
      gambar: p.gambar,
      category: p.category || "Makanan",
      stock: p.stock || 0,
}));

    setProducts(formatted);
  } catch (error) {
    console.error("❌ Gagal mengambil produk:", error);
  }
  setLoading(false);
};

  // 🔹 Jalankan fetch + auth check
  useEffect(() => {
    const token = localStorage.getItem("kasirToken");
    if (!token) router.push("/login");
    fetchProducts();
  }, [router]);

  // 🔹 Hapus Produk
  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      try {
        await fetch(`${API_URL}/menu/${id}`, { method: "DELETE" });
        fetchProducts();
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
      }
    }
  };

  // 🔹 Buka Modal Edit
  const openEditModal = (product: Product) => {
    setNewFileGambar(null);
    setCurrentProduct(product);
    if (editModal) editModal.show();
  };

  // 🔹 Submit Edit Produk
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const formData = new FormData();
    formData.append("nama", currentProduct.nama);
    formData.append("harga", currentProduct.harga.toString());
    formData.append("category", currentProduct.category);
    formData.append("stock", currentProduct.stock.toString());

    if (newFileGambar) {
      formData.append("gambar", newFileGambar);
    } else if (!currentProduct.gambar) {
      formData.append("gambar", "");
    }

    try {
      const res = await fetch(
        `${API_URL}/menu/update/${currentProduct._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengupdate produk");

      fetchProducts();
      if (editModal) editModal.hide();
    } catch (error) {
      console.error("Gagal mengupdate produk:", error);
    }
  };

  // 🔹 Handle Input Modal
  const handleModalInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (currentProduct) {
      const { name, value, type } = e.target;

      if (type === "file" && e.target instanceof HTMLInputElement && e.target.files?.[0]) {
        setNewFileGambar(e.target.files[0]);
        setCurrentProduct({
          ...currentProduct,
          gambar: URL.createObjectURL(e.target.files[0]),
        });
        return;
      }

      if (type === "number") {
        setCurrentProduct({ ...currentProduct, [name]: parseFloat(value) || 0 });
      } else {
        setCurrentProduct({ ...currentProduct, [name]: value });
      }
    }
  };

  // 🔹 Hapus Foto Lama
  const removeExistingImage = () => {
    if (currentProduct) {
      setCurrentProduct({ ...currentProduct, gambar: "" });
      setNewFileGambar(null);
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
                  <td colSpan={7} className="text-center">
                    Memuat data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={
                          product.gambar ||
                          "https://via.placeholder.com/100/CCCCCC/808080?text=NO+IMG"
                        }
                        alt={product.nama}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </td>
                    <td>{product._id.slice(-6)}</td>
                    <td>{product.nama}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {product.category}
                      </span>
                    </td>
                    <td>{formatCurrency(product.harga)}</td>
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

      {/* 🔹 Modal Edit Produk */}
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
                      <label className="form-label">Nama Menu</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nama"
                        value={currentProduct.nama}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-select"
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
                      <label className="form-label">Harga (Rp)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="harga"
                        value={currentProduct.harga ?? ""}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Stok</label>
                      <input
                        type="number"
                        className="form-control"
                        name="stock"
                        value={currentProduct.stock ?? ""}
                        onChange={handleModalInputChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Foto Menu Saat Ini</label>
                      {currentProduct.gambar ? (
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={currentProduct.gambar}
                            alt={currentProduct.nama}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            className="img-thumbnail me-3"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={removeExistingImage}
                          >
                            Hapus Foto
                          </button>
                        </div>
                      ) : (
                        <p className="text-muted">Tidak ada foto terdaftar.</p>
                      )}

                      <label className="form-label mt-2">
                        Ganti Foto Menu
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleModalInputChange}
                      />
                      {newFileGambar && (
                        <small className="text-success">
                          File baru siap diupload: {newFileGambar.name}
                        </small>
                      )}
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
