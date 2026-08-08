import { ipcMain, dialog, BrowserWindow } from 'electron'
import { getPrisma, getDbPath, restoreDatabase } from './database'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import * as fs from 'fs'

export function registerIpcHandlers(): void {
  // IPC handler untuk mengambil semua produk
  ipcMain.handle('get-products', async () => {
    const prisma = getPrisma()
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
  })

  // IPC handler untuk menambahkan produk baru
  ipcMain.handle(
    'create-product',
    async (
      _,
      data: { name: string; price: number; purchasePrice: number; stock: number; type: string }
    ) => {
      const prisma = getPrisma()
      return await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          purchasePrice: data.purchasePrice,
          stock: data.stock,
          type: data.type
        }
      })
    }
  )

  // IPC handler untuk memperbarui produk
  ipcMain.handle(
    'update-product',
    async (
      _,
      data: {
        id: number
        name: string
        price: number
        purchasePrice: number
        stock: number
        type: string
      }
    ) => {
      const prisma = getPrisma()
      return await prisma.product.update({
        where: { id: data.id },
        data: {
          name: data.name,
          price: data.price,
          purchasePrice: data.purchasePrice,
          stock: data.stock,
          type: data.type
        }
      })
    }
  )

  // IPC handler untuk menghapus produk
  ipcMain.handle('delete-product', async (_, id: number) => {
    const prisma = getPrisma()
    return await prisma.$transaction(async (tx) => {
      // Hapus semua TransactionItem yang mereferensikan produk ini terlebih dahulu
      await tx.transactionItem.deleteMany({
        where: { productId: id }
      })
      // Baru hapus produknya
      return await tx.product.delete({
        where: { id }
      })
    })
  })

  // IPC handler untuk mengambil semua tipe produk
  ipcMain.handle('get-product-types', async () => {
    const prisma = getPrisma()
    return await prisma.productType.findMany({
      orderBy: { id: 'asc' }
    })
  })

  // IPC handler untuk membuat tipe produk baru
  ipcMain.handle('create-product-type', async (_, data: { name: string }) => {
    const prisma = getPrisma()
    return await prisma.productType.create({
      data: {
        name: data.name
      }
    })
  })

  // IPC handler untuk memperbarui tipe produk
  ipcMain.handle('update-product-type', async (_, data: { id: number; name: string }) => {
    const prisma = getPrisma()
    return await prisma.productType.update({
      where: { id: data.id },
      data: {
        name: data.name
      }
    })
  })

  // IPC handler untuk menghapus tipe produk
  ipcMain.handle('delete-product-type', async (_, id: number) => {
    const prisma = getPrisma()
    return await prisma.productType.delete({
      where: { id }
    })
  })
  // IPC handler untuk memproses transaksi kasir (menyimpan transaksi + potong stok)
  ipcMain.handle(
    'create-transaction',
    async (
      _,
      data: {
        seller: string
        buyer: string
        cashReceived?: number
        change?: number
        items: { productId: number; quantity: number; price: number; purchasePrice?: number }[]
      }
    ) => {
      const prisma = getPrisma()
      // Calculate total quantity and total price from items
      const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      return await prisma.$transaction(async (tx) => {
        // 1. Simpan Transaksi Utama dengan qty dan total price beserta seller & buyer
        const transaction = await tx.transaction.create({
          data: {
            total: totalPrice,
            qty: totalQty,
            price: totalPrice,
            seller: data.seller,
            buyer: data.buyer,
            cashReceived: data.cashReceived ?? 0,
            change: data.change ?? 0,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                purchasePrice: item.purchasePrice
              }))
            }
          }
        })

        // 2. Kurangi stok produk untuk setiap item yang dibeli
        for (const item of data.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })
        }

        return transaction
      })
    }
  )

  ipcMain.handle('get-transactions', async () => {
    const prisma = getPrisma()
    return await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  })

  // IPC handler untuk menghapus transaksi dari riwayat dan mengembalikan stok barang
  ipcMain.handle('delete-transaction', async (_, id: number) => {
    try {
      const prisma = getPrisma()
      return await prisma.$transaction(async (tx) => {
        // 1. Ambil detail items untuk mengembalikan stok
        const items = await tx.transactionItem.findMany({
          where: { transactionId: id }
        })

        // 2. Kembalikan stok untuk setiap produk jika produk masih ada
        for (const item of items) {
          if (item.productId) {
            const productExists = await tx.product.findUnique({
              where: { id: item.productId }
            })
            if (productExists) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity
                  }
                }
              })
            }
          }
        }

        // 3. Hapus detail item transaksi (karena foreign key constraint)
        await tx.transactionItem.deleteMany({
          where: { transactionId: id }
        })

        // 4. Hapus transaksi utama
        await tx.transaction.delete({
          where: { id }
        })

        return { success: true }
      })
    } catch (err: any) {
      console.error('Gagal menghapus transaksi:', err)
      return { success: false, message: err.message || 'Gagal menghapus transaksi dari database' }
    }
  })

  // IPC handler untuk register user baru
  ipcMain.handle(
    'register',
    async (_, data: { username: string; name: string; password: string }) => {
      const prisma = getPrisma()
      // Cek apakah username sudah dipakai
      const existing = await prisma.users.findFirst({ where: { username: data.username } })
      if (existing) {
        throw new Error('Username sudah digunakan')
      }
      const hashed = await bcrypt.hash(data.password, 10)
      const user = await prisma.users.create({
        data: { username: data.username, name: data.name, password: hashed }
      })
      return { id: user.id, username: user.username, name: user.name }
    }
  )

  // IPC handler untuk login
  ipcMain.handle('login', async (_, data: { username: string; password: string }) => {
    const prisma = getPrisma()
    const user = await prisma.users.findFirst({ where: { username: data.username } })
    if (!user) {
      throw new Error('Username atau password salah')
    }
    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      throw new Error('Username atau password salah')
    }
    return { id: user.id, username: user.username, name: user.name }
  })

  // IPC handler untuk ekspor data transaksi ke excel
  ipcMain.handle('export-to-excel', async (_, transactions: any[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Simpan Laporan Transaksi',
      defaultPath: 'laporan-transaksi.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (!filePath) {
      return { success: false, message: 'Ekspor dibatalkan' }
    }

    // Format Detail Item Transaksi lengkap
    const rows: any[] = []
    let totalQty = 0
    let totalCostSum = 0
    let totalSalesSum = 0
    let totalProfitSum = 0

    transactions.forEach((t) => {
      if (t.items && Array.isArray(t.items)) {
        t.items.forEach((item) => {
          const purchasePrice =
            item.purchasePrice !== null && item.purchasePrice !== undefined
              ? item.purchasePrice
              : (item.product?.purchasePrice ?? 0)
          const sellPrice = item.price
          const quantity = item.quantity
          const totalCost = purchasePrice * quantity
          const totalSales = sellPrice * quantity
          const profit = totalSales - totalCost

          totalQty += quantity
          totalCostSum += totalCost
          totalSalesSum += totalSales
          totalProfitSum += profit

          rows.push({
            'ID Transaksi': t.id,
            Tanggal: new Date(t.createdAt).toLocaleString('id-ID'),
            'Penjual (Kasir)': t.seller || 'Umum',
            Pembeli: t.buyer || 'Umum',
            Barang: item.product?.name || 'Barang Dihapus',
            'Sisa Stok': item.product?.stock ?? 0,
            Qty: quantity,
            'Harga Beli Satuan': purchasePrice,
            'Harga Jual Satuan': sellPrice,
            'Total Harga Beli': totalCost,
            'Total Harga Jual': totalSales,
            'Laba Kotor': profit
          })
        })
      }
    })

    if (rows.length > 0) {
      // Spacing row
      rows.push({
        'ID Transaksi': '',
        Tanggal: '',
        'Penjual (Kasir)': '',
        Pembeli: '',
        Barang: '',
        'Sisa Stok': '',
        Qty: '',
        'Harga Beli Satuan': '',
        'Harga Jual Satuan': '',
        'Total Harga Beli': '',
        'Total Harga Jual': '',
        'Laba Kotor': ''
      })
      // Total row
      rows.push({
        'ID Transaksi': 'TOTAL',
        Tanggal: '',
        'Penjual (Kasir)': '',
        Pembeli: '',
        Barang: '',
        'Sisa Stok': '',
        Qty: totalQty,
        'Harga Beli Satuan': '',
        'Harga Jual Satuan': '',
        'Total Harga Beli': totalCostSum,
        'Total Harga Jual': totalSalesSum,
        'Laba Kotor': totalProfitSum
      })
    }

    try {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi')

      XLSX.writeFile(wb, filePath)
      return { success: true, filePath }
    } catch (err: any) {
      console.error('Gagal menulis file excel:', err)
      return { success: false, message: err.message || 'Gagal menyimpan file' }
    }
  })

  // IPC handler untuk ekspor laporan penjualan barang ke excel
  ipcMain.handle('export-sales-report', async (_, reportData: any[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Simpan Laporan Penjualan Barang',
      defaultPath: 'laporan-penjualan-barang.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (!filePath) {
      return { success: false, message: 'Ekspor dibatalkan' }
    }

    const rows: any[] = reportData.map((item, index) => ({
      No: index + 1,
      'Nama Barang': item.name,
      Tipe: item.type,
      'Sisa Stok': item.stock,
      'Jumlah Terjual (Qty)': item.quantitySold,
      'Harga Beli Rata-Rata': Math.round(item.avgPurchasePrice),
      'Harga Jual Rata-Rata': Math.round(item.avgSellPrice),
      'Total Modal (Beli)': item.totalCost,
      'Total Omset (Jual)': item.totalRevenue,
      'Laba Kotor': item.profit
    }))

    // Calculate sum totals
    let totalQty = 0
    let totalCost = 0
    let totalRevenue = 0
    let totalProfit = 0

    for (const item of reportData) {
      totalQty += item.quantitySold
      totalCost += item.totalCost
      totalRevenue += item.totalRevenue
      totalProfit += item.profit
    }

    if (rows.length > 0) {
      // Spacing row
      rows.push({
        No: '',
        'Nama Barang': '',
        Tipe: '',
        'Sisa Stok': '',
        'Jumlah Terjual (Qty)': '',
        'Harga Beli Rata-Rata': '',
        'Harga Jual Rata-Rata': '',
        'Total Modal (Beli)': '',
        'Total Omset (Jual)': '',
        'Laba Kotor': ''
      })
      // Total row
      rows.push({
        No: 'TOTAL',
        'Nama Barang': '',
        Tipe: '',
        'Sisa Stok': '',
        'Jumlah Terjual (Qty)': totalQty,
        'Harga Beli Rata-Rata': '',
        'Harga Jual Rata-Rata': '',
        'Total Modal (Beli)': totalCost,
        'Total Omset (Jual)': totalRevenue,
        'Laba Kotor': totalProfit
      })
    }

    try {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan')

      XLSX.writeFile(wb, filePath)
      return { success: true, filePath }
    } catch (err: any) {
      console.error('Gagal menulis file excel:', err)
      return { success: false, message: err.message || 'Gagal menyimpan file' }
    }
  })

  // IPC handler untuk cetak ke PDF
  ipcMain.handle('print-to-pdf', async (_, transaction: any) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Simpan Nota Belanja (PDF)',
      defaultPath: `nota-transaksi-${transaction.id}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (!filePath) {
      return { success: false, message: 'Cetak PDF dibatalkan' }
    }

    try {
      const html = generateReceiptHtml(transaction)
      await printHtml(html, 'pdf', filePath)
      return { success: true, filePath }
    } catch (err: any) {
      console.error('Gagal cetak PDF:', err)
      return { success: false, message: err.message || 'Gagal membuat PDF' }
    }
  })

  // IPC handler untuk Backup Database SQLite
  ipcMain.handle('backup-database', async () => {
    try {
      const dbPath = getDbPath()
      if (!fs.existsSync(dbPath)) {
        return { success: false, message: 'File database tidak ditemukan di sistem' }
      }

      const todayStr = new Date().toISOString().split('T')[0]
      const defaultFilename = `backup-kasir-koperasi-${todayStr}.db`

      const { filePath } = await dialog.showSaveDialog({
        title: 'Simpan Backup Database (.db)',
        defaultPath: defaultFilename,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      })

      if (!filePath) {
        return { success: false, message: 'Backup dibatalkan' }
      }

      fs.copyFileSync(dbPath, filePath)
      return { success: true, filePath }
    } catch (err: any) {
      console.error('Gagal membuat backup database:', err)
      return { success: false, message: err.message || 'Gagal membuat backup database' }
    }
  })

  // IPC handler untuk Restore Database SQLite
  ipcMain.handle('restore-database', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Pilih File Backup Database (.db)',
        properties: ['openFile'],
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      })

      if (!filePaths || filePaths.length === 0) {
        return { success: false, message: 'Restore dibatalkan' }
      }

      const backupPath = filePaths[0]
      await restoreDatabase(backupPath)

      return { success: true }
    } catch (err: any) {
      console.error('Gagal memulihkan database:', err)
      return { success: false, message: err.message || 'Gagal memulihkan database' }
    }
  })

  // IPC handler untuk cetak langsung ke printer
  ipcMain.handle('print-to-printer', async (_, transaction: any) => {
    try {
      const html = generateReceiptHtml(transaction)
      await printHtml(html, 'printer')
      return { success: true }
    } catch (err: any) {
      console.error('Gagal cetak ke printer:', err)
      return { success: false, message: err.message || 'Gagal mengirim ke printer' }
    }
  })
}

// Helper untuk menghasilkan HTML nota belanja/struk thermal
function generateReceiptHtml(t: any): string {
  const itemsHtml = (t.items || [])
    .map((item: any) => {
      const itemTotal = item.price * item.quantity
      return `
    <tr>
      <td style="word-break: break-word; text-align: left;">${item.product?.name || 'Barang Dihapus'}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${item.price.toLocaleString('id-ID')}</td>
      <td style="text-align: right;">${itemTotal.toLocaleString('id-ID')}</td>
    </tr>
  `
    })
    .join('')

  const dateStr = new Date(t.createdAt).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nota Belanja #${t.id}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 10.5px;
          font-weight: 700;
          color: #000000;
          word-break: break-word;
          overflow-wrap: break-word;
          -webkit-font-smoothing: none;
          text-rendering: geometricPrecision;
        }
        .receipt-body {
          width: 49mm !important;
          max-width: 49mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .header { margin: 0 0 4px 0 !important; padding: 0 !important; }
        .title { font-size: 16px; font-weight: 800; margin: 0 0 2px 0 !important; padding: 0 !important; line-height: 1.1; }
        .divider { border-top: 1.5px solid black; margin: 4px 0; }
        .meta-table, .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .meta-table td { font-size: 10px; font-weight: 700; padding: 1px 0; vertical-align: top; color: #000000; }
        .items-table th, .items-table td { font-size: 10px; font-weight: 700; padding: 2px 0; vertical-align: top; color: #000000; }
        .items-table th { border-bottom: 1.5px solid black; font-weight: 800; }
        .summary-section { margin-top: 5px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 700; padding: 1px 0; color: #000000; }
        .grand-total { font-weight: 800; font-size: 12.5px; border-top: 1.5px solid black; padding-top: 3px; margin-top: 3px; }
        .footer { margin-top: 8px; font-size: 9px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="receipt-body">
        <div class="header text-center"><div class="title">KDMP ULIAN</div><div class="divider"></div></div>
        
        <table class="meta-table">
          <tbody>
            <tr><td style="width: 70px;">ID Transaksi</td><td>: #${t.id}</td></tr>
            <tr><td>Tanggal</td><td>: ${dateStr}</td></tr>
            <tr><td>Penjual</td><td>: ${t.seller || 'Umum'}</td></tr>
            <tr><td>Pembeli</td><td>: ${t.buyer || 'Umum'}</td></tr>
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 36%;">Barang</th>
              <th style="text-align: center; width: 12%;">Qty</th>
              <th style="text-align: right; width: 26%;">Harga</th>
              <th style="text-align: right; width: 26%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="summary-section">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>Rp${t.total.toLocaleString('id-ID')}</span>
          </div>
          <div class="summary-row">
            <span>Pajak (0%)</span>
            <span>Rp0</span>
          </div>
          <div class="summary-row grand-total">
            <span>TOTAL AKHIR</span>
            <span>Rp${t.total.toLocaleString('id-ID')}</span>
          </div>
          ${
            t.cashReceived !== undefined && t.cashReceived > 0
              ? `
          <div class="summary-row" style="margin-top: 3px;">
            <span>Uang Bayar</span>
            <span>Rp${t.cashReceived.toLocaleString('id-ID')}</span>
          </div>
          <div class="summary-row">
            <span>Kembalian</span>
            <span>Rp${t.change.toLocaleString('id-ID')}</span>
          </div>
          `
              : ''
          }
        </div>
        
        <div class="footer text-center">
          <div>Terima Kasih Atas Kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Helper untuk mencetak konten HTML ke PDF atau printer fisik menggunakan window tersembunyi
async function printHtml(
  htmlContent: string,
  mode: 'pdf' | 'printer',
  filePath?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const tempWindow = new BrowserWindow({
      width: 250,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    tempWindow.loadURL(dataUrl)

    tempWindow.webContents.on('did-finish-load', async () => {
      try {
        if (mode === 'pdf') {
          const pdfBuffer = await tempWindow.webContents.printToPDF({
            margins: { marginType: 'none' },
            pageSize: { width: 80000, height: 160000 }, // 80mm x 160mm custom size in microns
            preferCSSPageSize: true,
            printBackground: true
          })
          if (filePath) {
            fs.writeFileSync(filePath, pdfBuffer)
          }
          tempWindow.destroy()
          resolve({ success: true })
        } else {
          tempWindow.webContents.print(
            {
              silent: false,
              printBackground: true,
              margins: { marginType: 'none' }
            },
            (success, errorType) => {
              tempWindow.destroy()
              if (success) {
                resolve({ success: true })
              } else {
                reject(new Error(errorType || 'Pencetakan dibatalkan'))
              }
            }
          )
        }
      } catch (err) {
        tempWindow.destroy()
        reject(err)
      }
    })
  })
}
