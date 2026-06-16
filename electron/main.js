const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

const windows = new Map()

const windowConfigs = {
  dashboard: { type: 'dashboard', title: '总控大盘', width: 1400, height: 900 },
  queue: { type: 'queue', title: '分区队列', width: 1200, height: 800 },
  broadcast: { type: 'broadcast', title: '广播台', width: 1000, height: 700 },
  events: { type: 'events', title: '事件中心', width: 1100, height: 750 },
  review: { type: 'review', title: '班次复盘', width: 1200, height: 800 },
  settings: { type: 'settings', title: '设置中心', width: 1000, height: 700 }
}

function createWindow(type) {
  if (windows.has(type)) {
    const win = windows.get(type)
    if (win.isMinimized()) win.restore()
    win.focus()
    return win
  }

  const config = windowConfigs[type] || windowConfigs.dashboard
  const primaryDisplay = screen.getPrimaryDisplay()
  const { workArea } = primaryDisplay
  const count = windows.size

  const win = new BrowserWindow({
    title: '物流园调度中心 - ' + config.title,
    width: config.width,
    height: config.height,
    x: workArea.x + 50 + count * 30,
    y: workArea.y + 50 + count * 30,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0f1a',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl + '#/' + type)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: type })
  }

  win.on('ready-to-show', () => win.show())
  win.on('closed', () => windows.delete(type))
  windows.set(type, win)
  return win
}

function createAllWindows() {
  createWindow('dashboard')
  setTimeout(() => createWindow('queue'), 200)
  setTimeout(() => createWindow('events'), 400)
}

app.whenReady().then(() => {
  createAllWindows()
  app.on('activate', () => {
    if (windows.size === 0) createAllWindows()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('window:open', (_event, type) => {
  createWindow(type)
  return true
})

ipcMain.handle('window:close', (_event, type) => {
  const win = windows.get(type)
  if (win) { win.close(); return true }
  return false
})

ipcMain.handle('window:list', () => Array.from(windows.keys()))

ipcMain.on('dispatch:notify', (event, data) => {
  windows.forEach((win) => {
    if (win.webContents !== event.sender) {
      win.webContents.send('dispatch:notify', data)
    }
  })
})
