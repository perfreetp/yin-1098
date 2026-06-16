import { useEffect, useState } from 'react'
import { useDispatchStore } from '../store/dispatchStore'

interface Props {
  currentPage: string
  title: string
}

const navItems = [
  { key: 'dashboard', label: '总控大盘', icon: '📊' },
  { key: 'queue', label: '分区队列', icon: '🚦' },
  { key: 'broadcast', label: '广播台', icon: '📢' },
  { key: 'events', label: '事件中心', icon: '⚠️' },
  { key: 'review', label: '班次复盘', icon: '📈' },
  { key: 'settings', label: '设置中心', icon: '⚙️' }
]

function PageHeader({ currentPage, title }: Props) {
  const { currentStrategy, strategies, currentOperator, currentTime } = useDispatchStore()
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const update = () => {
      const t = new Date()
      setTimeStr(t.toLocaleTimeString('zh-CN', { hour12: false }))
      setDateStr(t.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }))
    }
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  const strategy = strategies.find(s => s.type === currentStrategy)

  const handleNav = (key: string) => {
    window.location.hash = key
    if ((window as any).electronAPI) {
      ;(window as any).electronAPI.openWindow(key)
    }
  }

  return (
    <div className="page-header">
      <div className="flex-row" style={{ alignItems: 'center', gap: 24 }}>
        <div>
          <div className="page-title">▌ {title}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#88a0c0' }}>
            物流园智慧调度指挥平台 v2.3.1
          </div>
        </div>
        <div className="header-info">
          <div style={{ textAlign: 'center' }}>
            <div className="header-time">{timeStr}</div>
            <div style={{ fontSize: 11, color: '#88a0c0' }}>{dateStr}</div>
          </div>
          {strategy && (
            <div className="header-strategy" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{strategy.icon}</span>
              <span>{strategy.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot status-green" />
            <span style={{ color: '#00ff88', fontSize: 12 }}>{currentOperator.name}</span>
            <span className="tag">{currentOperator.role === 'admin' ? '管理员' : currentOperator.role === 'supervisor' ? '主管' : currentOperator.role === 'dispatcher' ? '调度员' : '观察员'}</span>
            <span className="tag">{currentOperator.shift}</span>
          </div>
        </div>
      </div>
      <div className="nav-buttons">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => handleNav(item.key)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PageHeader
