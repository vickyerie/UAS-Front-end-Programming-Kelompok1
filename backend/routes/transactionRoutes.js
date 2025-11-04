const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getDailyReport,  
  deleteTransactionById,
} = require('../controllers/transactionController.js');

router.post('/', createTransaction);

router.get('/', getAllTransactions);

router.get('/:id', getTransactionById);

router.get('/report/daily', getDailyReport);

router.delete('/:id', deleteTransactionById);

module.exports = router;