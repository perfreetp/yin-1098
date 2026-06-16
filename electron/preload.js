const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openWindow: (type) => ipcRenderer.invoke('window:open', type),
  closeWindow: (type) => ipcRenderer.invoke('window:close', type),
  listWindows: () => ipcRenderer.invoke('window:list'),
  showWindow: (type) => ipcRenderer.invoke('window:show', type),
  minimizeWindow: (type) => ipcRenderer.invoke('window:minimize', type),
  navigateWindow: (type) => ipcRenderer.invoke('window:navigate', type),
  notifyOtherWindows: (data) => ipcRenderer.send('dispatch:notify', data),
  onSyncState: (callback) => {
    const handler = (_event, data) => callback(_event, data)
    ipcRenderer.on('dispatch:notify', handler)
    return () => ipcRenderer.removeListener('dispatch:notify', handler)
  },
  onNavigateRoute: (callback) => {
    const handler = (_event, route) => callback(route)
    ipcRenderer.on('navigate:route', handler)
    return () => ipcRenderer.removeListener('navigate:route', handler)
  }
})
