/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openWindow: (type: string) => Promise<boolean>
    closeWindow: (type: string) => Promise<boolean>
    listWindows: () => Promise<string[]>
    notifyDispatch: (data: any) => void
    onDispatchNotify: (callback: (data: any) => void) => void
  }
}
