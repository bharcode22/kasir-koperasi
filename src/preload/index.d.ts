import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getProducts: () => Promise<any[]>
      createProduct: (data: { name: string; price: number; sku: string; stock: number }) => Promise<any>
      createTransaction: (data: { total: number; items: { productId: number; quantity: number; price: number }[] }) => Promise<any>
    }
  }
}
