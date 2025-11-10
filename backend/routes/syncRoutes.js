// backend/routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// Sync offline transactions to database
router.post('/transactions', syncController.syncTransactions);

// Check current stock levels
router.post('/stock-check', syncController.checkStock);

// Health check
router.get('/health', syncController.syncHealthCheck);

module.exports = router;