import { app } from 'electron'
import { join } from 'path'
import { existsSync, copyFileSync, statSync } from 'fs'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

let prisma: PrismaClient

export function initializeDatabase(): PrismaClient {
  const isDev = !app.isPackaged
  let dbPath: string

  if (isDev) {
    dbPath = join(process.cwd(), 'prisma/dev.db')
  } else {
    // Simpan database di folder data aplikasi pengguna (aman dan standar Windows/macOS)
    const userDataPath = app.getPath('userData')
    dbPath = join(userDataPath, 'kasir.db')

    // Salin template dev.db dari package resources jika kasir.db belum ada atau kosong/corrupt (< 20KB)
    let shouldCopy = false
    if (!existsSync(dbPath)) {
      shouldCopy = true
    } else {
      try {
        const stats = statSync(dbPath)
        if (stats.size < 20000) {
          // Template dev.db asli berukuran ~40KB
          shouldCopy = true
        }
      } catch (err) {
        shouldCopy = true
      }
    }

    if (shouldCopy) {
      const templatePath = join(process.resourcesPath, 'prisma/dev.db')
      if (existsSync(templatePath)) {
        copyFileSync(templatePath, dbPath)
      }
    }
  }

  // Inisialisasi adapter Prisma SQLite untuk Prisma 7
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })

  // Inisialisasi Prisma Client dengan adapter
  prisma = new PrismaClient({ adapter })

  // Jalankan migrasi mandiri secara asinkron agar kolom baru langsung dibuat jika belum ada
  runManualMigrations(prisma).catch((err) => {
    console.error('Gagal menjalankan migrasi otomatis pada dbPath:', dbPath, err)
  })

  return prisma
}

async function runManualMigrations(client: PrismaClient): Promise<void> {
  try {
    // 1. Tambah purchasePrice ke tabel Product jika belum ada
    try {
      await client.$executeRawUnsafe(
        'ALTER TABLE "Product" ADD COLUMN "purchasePrice" REAL DEFAULT 0;'
      )
      console.log('Migrasi kolom "purchasePrice" ke Product berhasil.')
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('duplicate column') || err.message.includes('already exists'))
      ) {
        // Kolom sudah ada, abaikan
      } else {
        console.error('Gagal migrasi kolom purchasePrice:', err.message || err)
      }
    }

    // 2. Tambah cashReceived ke tabel Transaction jika belum ada
    try {
      await client.$executeRawUnsafe(
        'ALTER TABLE "Transaction" ADD COLUMN "cashReceived" REAL DEFAULT 0;'
      )
      console.log('Migrasi kolom "cashReceived" ke Transaction berhasil.')
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('duplicate column') || err.message.includes('already exists'))
      ) {
        // Kolom sudah ada, abaikan
      } else {
        console.error('Gagal migrasi kolom cashReceived:', err.message || err)
      }
    }

    // 3. Tambah change ke tabel Transaction jika belum ada
    try {
      await client.$executeRawUnsafe(
        'ALTER TABLE "Transaction" ADD COLUMN "change" REAL DEFAULT 0;'
      )
      console.log('Migrasi kolom "change" ke Transaction berhasil.')
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('duplicate column') || err.message.includes('already exists'))
      ) {
        // Kolom sudah ada, abaikan
      } else {
        console.error('Gagal migrasi kolom change:', err.message || err)
      }
    }

    // 4. Tambah tabel Expense jika belum ada
    try {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Expense" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "title" TEXT NOT NULL,
          "category" TEXT NOT NULL DEFAULT 'Operasional',
          "amount" REAL NOT NULL,
          "qty" INTEGER DEFAULT 0,
          "notes" TEXT NOT NULL DEFAULT '',
          "productId" INTEGER
        );
      `)
      console.log('Migrasi tabel "Expense" berhasil.')
    } catch (err: any) {
      console.error('Gagal migrasi tabel Expense:', err.message || err)
    }

    // 5. Tambah purchasePrice ke tabel TransactionItem jika belum ada
    try {
      await client.$executeRawUnsafe(
        'ALTER TABLE "TransactionItem" ADD COLUMN "purchasePrice" REAL NULL;'
      )
      console.log('Migrasi kolom "purchasePrice" ke TransactionItem berhasil.')
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('duplicate column') || err.message.includes('already exists'))
      ) {
        // Kolom sudah ada, abaikan
      } else {
        console.error('Gagal migrasi kolom purchasePrice ke TransactionItem:', err.message || err)
      }
    }
  } catch (globalErr: any) {
    console.error('Global error migrasi manual:', globalErr.message || globalErr)
  }
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    return initializeDatabase()
  }
  return prisma
}
