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
  return prisma
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    return initializeDatabase()
  }
  return prisma
}
