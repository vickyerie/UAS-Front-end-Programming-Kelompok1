const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ambil URI dari variabel MONGODB_URI di file .env
const uri = process.env.MONGODB_URI;

// Koneksikan ke MongoDB
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("Koneksi ke MongoDB (Kantin_UAS) berhasil!");
});

// === 1. Impor Routes (INI YANG MUNGKIN HILANG) ===
const akunRouter = require('./routes/akun');
// (Nanti kita akan impor menuRouter, orderRouter, dll di sini)


// Rute tes sederhana
app.get('/', (req, res) => {
  res.json({ message: "Halo! Server Backend Kasir berjalan!" });
});

// === 2. Gunakan Routes (INI YANG MUNGKIN HILANG) ===
// Ini memberi tahu Express: "Setiap request yang datang ke /akun,
// tolong teruskan ke 'akunRouter'"
app.use('/akun', akunRouter); 


// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});