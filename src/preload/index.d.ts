import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getProducts: () => Promise<any[]>
      createProduct: (data: { name: string; price: number; stock: number; type: string }) => Promise<any>
      createTransaction: (data: { total: number; items: { productId: number; quantity: number; price: number }[] }) => Promise<any>
      updateProduct: (data: { id: number; name: string; price: number; stock: number; type: string }) => Promise<any>
      deleteProduct: (id: number) => Promise<any>
      getProductTypes: () => Promise<any[]>
      createProductType: (data: { name: string }) => Promise<any>
      updateProductType: (data: { id: number; name: string }) => Promise<any>
      deleteProductType: (id: number) => Promise<any>
      getTransactions: () => Promise<any[]>
      deleteTransaction: (id: number) => Promise<any>
    }
  }
}
