import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getProducts: () => ipcRenderer.invoke('get-products'),
  createProduct: (data: { name: string; price: number; sku: string; stock: number }) =>
    ipcRenderer.invoke('create-product', data),
  createTransaction: (data: { total: number; items: { productId: number; quantity: number; price: number }[] }) =>
    ipcRenderer.invoke('create-transaction', data)
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
