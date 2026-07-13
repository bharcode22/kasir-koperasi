import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getProducts: () => Promise<any[]>
      createProduct: (data: {
        name: string
        price: number
        purchasePrice: number
        stock: number
        type: string
      }) => Promise<any>
      createTransaction: (data: {
        seller: string
        buyer: string
        cashReceived?: number
        change?: number
        items: { productId: number; quantity: number; price: number }[]
      }) => Promise<any>
      updateProduct: (data: {
        id: number
        name: string
        price: number
        purchasePrice: number
        stock: number
        type: string
      }) => Promise<any>
      deleteProduct: (id: number) => Promise<any>
      getProductTypes: () => Promise<any[]>
      createProductType: (data: { name: string }) => Promise<any>
      updateProductType: (data: { id: number; name: string }) => Promise<any>
      deleteProductType: (id: number) => Promise<any>
      getTransactions: () => Promise<any[]>
      deleteTransaction: (id: number) => Promise<any>
      login: (data: {
        username: string
        password: string
      }) => Promise<{ id: number; username: string; name: string }>
      register: (data: {
        username: string
        name: string
        password: string
      }) => Promise<{ id: number; username: string; name: string }>
      exportToExcel: (
        transactions: any[]
      ) => Promise<{ success: boolean; filePath?: string; message?: string }>
      exportSalesReport: (
        reportData: any[]
      ) => Promise<{ success: boolean; filePath?: string; message?: string }>
      printToPDF: (
        transaction: any
      ) => Promise<{ success: boolean; filePath?: string; message?: string }>
      printToPrinter: (transaction: any) => Promise<{ success: boolean; message?: string }>
    }
  }
}
