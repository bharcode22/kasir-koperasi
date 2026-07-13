import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getProducts: () => ipcRenderer.invoke('get-products'),
  createProduct: (data: {
    name: string
    price: number
    purchasePrice: number
    stock: number
    type: string
  }) => ipcRenderer.invoke('create-product', data),
  createTransaction: (data: {
    seller: string
    buyer: string
    items: { productId: number; quantity: number; price: number }[]
  }) => ipcRenderer.invoke('create-transaction', data),
  updateProduct: (data: {
    id: number
    name: string
    price: number
    purchasePrice: number
    stock: number
    type: string
  }) => ipcRenderer.invoke('update-product', data),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),
  getProductTypes: () => ipcRenderer.invoke('get-product-types'),
  createProductType: (data: { name: string }) => ipcRenderer.invoke('create-product-type', data),
  updateProductType: (data: { id: number; name: string }) =>
    ipcRenderer.invoke('update-product-type', data),
  deleteProductType: (id: number) => ipcRenderer.invoke('delete-product-type', id),
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  deleteTransaction: (id: number) => ipcRenderer.invoke('delete-transaction', id),
  login: (data: { username: string; password: string }) => ipcRenderer.invoke('login', data),
  register: (data: { username: string; name: string; password: string }) =>
    ipcRenderer.invoke('register', data),
  exportToExcel: (transactions: any[]) => ipcRenderer.invoke('export-to-excel', transactions),
  exportSalesReport: (reportData: any[]) => ipcRenderer.invoke('export-sales-report', reportData),
  printToPDF: (transaction: any) => ipcRenderer.invoke('print-to-pdf', transaction),
  printToPrinter: (transaction: any) => ipcRenderer.invoke('print-to-printer', transaction)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
