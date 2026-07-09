import { ipcMain } from 'electron'
import { getPrisma } from './database'
import bcrypt from 'bcryptjs'

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
    async (_, data: { name: string; price: number; stock: number; type: string }) => {
      const prisma = getPrisma()
      return await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
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
      data: { id: number; name: string; price: number; stock: number; type: string }
    ) => {
      const prisma = getPrisma()
      return await prisma.product.update({
        where: { id: data.id },
        data: {
          name: data.name,
          price: data.price,
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
  async (_, data: { seller: string; buyer: string; items: { productId: number; quantity: number; price: number }[] }) => {
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
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
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
);



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

  // IPC handler untuk menghapus transaksi dari riwayat
  ipcMain.handle('delete-transaction', async (_, id: number) => {
    const prisma = getPrisma()
    return await prisma.$transaction(async (tx) => {
      // Hapus detail item transaksi dulu (karena foreign key constraint)
      await tx.transactionItem.deleteMany({
        where: { transactionId: id }
      })
      // Hapus transaksi utama
      return await tx.transaction.delete({
        where: { id }
      })
    })
  })

  // IPC handler untuk register user baru
  ipcMain.handle('register', async (_, data: { username: string; name: string; password: string }) => {
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
  })

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
}
