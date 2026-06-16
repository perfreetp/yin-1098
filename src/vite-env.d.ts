/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openWindow: (type: string) => Promise<boolean>
    closeWindow: (type: string) => Promise<boolean>
    listWindows: () => Promise<string[]>
    showWindow: (type: string) => Promise<boolean>
    minimizeWindow: (type: string) => Promise<boolean>
    navigateWindow: (type: string) => Promise<boolean>
    notifyOtherWindows: (data: any) => void
    onSyncState: (callback: (event: any, data: any) => void) => () => void
    onNavigateRoute: (callback: (route: string) => void) => () => void
  }
}
