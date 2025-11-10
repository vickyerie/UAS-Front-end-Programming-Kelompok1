// backend/controllers/syncController.js
const Order = require('../models/Order.js');
const Menu = require('../models/menu.model.js');

/**
 * Sync multiple offline transactions to database
 * POST /api/sync/transactions
 */
exports.syncTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Format data tidak valid. Harap kirim array transactions.'
      });
    }

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada transaksi untuk disinkronkan',
        syncedCount: 0,
        failedCount: 0,
        results: []
      });
    }

    const results = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process each transaction
    for (const txData of transactions) {
      try {
        // Validate stock availability
        const stockErrors = [];
        for (const item of txData.items) {
          const product = await Menu.findById(item.productId);
          
          if (!product) {
            stockErrors.push(`Produk ${item.nama} tidak ditemukan`);
            continue;
          }

          if (product.stock < item.quantity) {
            stockErrors.push(`Stok ${item.nama} tidak cukup (tersedia: ${product.stock}, diminta: ${item.quantity})`);
          }
        }

        // If stock errors, mark as failed
        if (stockErrors.length > 0) {
          failedCount++;
          results.push({
            tempId: txData._id,
            success: false,
            error: stockErrors.join(', ')
          });
          continue;
        }

        // Create order in database
        const newOrder = new Order({
          items: txData.items,
          totalPrice: txData.totalPrice,
          paymentMethod: txData.paymentMethod,
          paymentAmount: txData.paymentAmount,
          changeAmount: txData.changeAmount,
          createdAt: txData.createdAt || new Date()
        });

        const savedOrder = await newOrder.save();

        // Update stock for each item
        for (const item of txData.items) {
          await Menu.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            { new: true }
          );
        }

        syncedCount++;
        results.push({
          tempId: txData._id,
          success: true,
          orderId: savedOrder._id,
          message: 'Transaksi berhasil disinkronkan'
        });

      } catch (error) {
        failedCount++;
        results.push({
          tempId: txData._id,
          success: false,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sinkronisasi selesai: ${syncedCount} berhasil, ${failedCount} gagal`,
      syncedCount,
      failedCount,
      results
    });

  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error saat sinkronisasi transaksi',
      error: error.message
    });
  }
};

/**
 * Get current stock levels for products
 * POST /api/sync/stock-check
 */
exports.checkStock = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Format data tidak valid. Harap kirim array productIds.'
      });
    }

    const stockLevels = [];

    for (const productId of productIds) {
      const product = await Menu.findById(productId);
      if (product) {
        stockLevels.push({
          productId: product._id,
          nama: product.nama,
          stock: product.stock,
          harga: product.harga
        });
      }
    }

    res.status(200).json({
      success: true,
      data: stockLevels
    });

  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error saat mengecek stok',
      error: error.message
    });
  }
};

/**
 * Health check for sync service
 * GET /api/sync/health
 */
exports.syncHealthCheck = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Sync service is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sync service error',
      error: error.message
    });
  }
};