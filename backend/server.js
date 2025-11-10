const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let server; 

// 🔹 Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// 🔹 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// 🔹 Koneksi MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log("✅ Koneksi ke MongoDB (Kantin_UAS) berhasil!"))
  .catch(err => console.error("❌ Error koneksi MongoDB:", err));

const connection = mongoose.connection;
connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));

// 🔹 Import Routes
const akunRouter = require('./routes/akun');
const menuRouter = require('./routes/menu');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const syncRoutes = require('./routes/syncRoutes');

// 🔹 Routes utama (SEMUA pakai prefix /api)
app.get('/', (req, res) => {
  res.json({ 
    message: "Halo! Server Backend Kasir berjalan!",
    version: "1.0.0",
    endpoints: {
      akun: "/api/akun",
      menu: "/api/menu",
      orders: "/api/orders",
      products: "/api/products",
      transactions: "/api/transactions",
      sync: "/api/sync"
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 🔹 Gunakan route dengan prefix /api
app.use('/api/akun', akunRouter); 
app.use('/api/menu', menuRouter); // 🔧 DIGANTI (dulu /menu)
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/sync', syncRoutes);

// 🔹 Handler error global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Terjadi kesalahan pada server!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 🔹 Handler 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint tidak ditemukan!' 
  });
});

// 🔹 Jalankan server
server = app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${uri ? 'Configured' : 'Not Configured'}`);
});

// 🔹 Shutdown aman
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});
