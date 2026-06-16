import { useState, useMemo } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader, { navigateToModule } from '../components/PageHeader'
import { AlertEvent, EventType, AlertLevel } from '../types'

function Events() {
  const {
    alerts, zones, vehicles, chargers, operators, currentOperator,
    acknowledgeAlert, resolveAlert, createAlert
  } = useDispatchStore()

  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'resolved'>('all')
  const [selected, setSelected] = useState<AlertEvent | null>(null)
  const [resolution, setResolution] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEvent, setNewEvent] = useState({ type: 'vehicle_fault' as EventType, level: 'warning' as AlertLevel, title: '', description: '', location: '' })

  const typeLabels: Record<EventType, { name: string; icon: string; color: string }> = {
    congestion: { name: '道路拥堵', icon: '🚦', color: '#ffaa00' },
    reverse: { name: '逆行检测', icon: '↩️', color: '#ff6644' },
    occupying: { name: '超时占用', icon: '⏰', color: '#ff8800' },
    vehicle_fault: { name: '车辆故障', icon: '🔧', color: '#ff4444' },
    charger_fault: { name: '充电桩故障', icon: '🔌', color: '#ff0044' },
    driver_missing: { name: '司机失联', icon: '📵', color: '#aa44ff' },
    emergency: { name: '紧急事件', icon: '🚨', color: '#ff0000' }
  }

  const levelLabels: Record<AlertLevel, { name: string; color: string }> = {
    info: { name: '提示', color: '#00d4ff' },
    warning: { name: '警告', color: '#ffaa00' },
    danger: { name: '严重', color: '#ff4444' },
    critical: { name: '紧急', color: '#ff0000' }
  }

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (levelFilter !== 'all' && a.level !== levelFilter) return false
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && (a.acknowledged || a.resolved)) return false
        if (statusFilter === 'processing' && (!a.acknowledged || a.resolved)) return false
        if (statusFilter === 'resolved' && !a.resolved) return false
      }
      return true
    })
  }, [alerts, levelFilter, typeFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      pending: alerts.filter(a => !a.acknowledged).length,
      processing: alerts.filter(a => a.acknowledged && !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      critical: alerts.filter(a => a.level === 'critical' && !a.resolved).length,
      danger: alerts.filter(a => a.level === 'danger' && !a.resolved).length,
      warning: alerts.filter(a => a.level === 'warning' && !a.resolved).length
    }
  }, [alerts])

  const formatTime = (d: Date | null) => d ? new Date(d).toLocaleString('zh-CN', { hour12: false }) : '-'
  const timeAgo = (d: Date) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    return `${Math.floor(mins / 60)}小时${mins % 60}分前`
  }

  const handleResolve = () => {
    if (!selected || !resolution) {
      alert('请填写处理说明')
      return
    }
    resolveAlert(selected.id, currentOperator.id, resolution)
    setResolution('')
    setSelected(prev => prev ? { ...prev, resolved: true, resolvedAt: new Date(), resolvedBy: currentOperator.id, resolution } : null)
  }

  const handleAck = (a: AlertEvent) => {
    acknowledgeAlert(a.id, currentOperator.id)
    setSelected(prev => prev && prev.id === a.id ? { ...prev, acknowledged: true, acknowledgedBy: currentOperator.id, acknowledgedAt: new Date() } : prev)
  }

  const handleCreate = () => {
    if (!newEvent.title) {
      alert('请填写事件标题')
      return
    }
    createAlert(newEvent)
    setShowCreateModal(false)
    setNewEvent({ type: 'vehicle_fault', level: 'warning', title: '', description: '', location: '' })
  }

  const eventVehicle = selected?.vehicleId ? vehicles.find(v => v.id === selected.vehicleId) : null
  const eventCharger = selected?.chargerId ? chargers.find(c => c.id === selected.chargerId) : null
  const eventZone = selected?.zoneId ? zones.find(z => z.id === selected.zoneId) : null

  return (
    <div className="page-container">
      <PageHeader currentPage="events" title="事件应急中心" />

      <div className="flex-row" style={{ marginBottom: 0 }}>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 42 }}>📋</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#00d4ff', fontSize: 26 }}>{stats.total}</div>
              <div className="stat-label">事件总数（今日）</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 42 }}>⏳</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#ffaa00', fontSize: 26 }}>{stats.pending}</div>
              <div className="stat-label">待确认</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 42 }}>🔧</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#ff6644', fontSize: 26 }}>{stats.processing}</div>
              <div className="stat-label">处理中</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 42 }}>✅</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#00ff88', fontSize: 26 }}>{stats.resolved}</div>
              <div className="stat-label">已解决</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 42 }}>{stats.critical > 0 ? '🚨' : stats.danger > 0 ? '⚠️' : '😊'}</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: stats.critical > 0 ? '#ff0000' : stats.danger > 0 ? '#ff4444' : '#00ff88', fontSize: 26 }}>
                {stats.critical || stats.danger || 0}
              </div>
              <div className="stat-label" style={{ color: stats.critical > 0 ? '#ff4444' : undefined }}>
                {stats.critical > 0 ? `紧急${stats.critical}件` : stats.danger > 0 ? `严重${stats.danger}件` : '无高危事件'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 12 }}>级别:</span>
            {[
              { k: 'all', l: '全部' },
              { k: 'critical', l: '🚨 紧急' },
              { k: 'danger', l: '🔴 严重' },
              { k: 'warning', l: '🟡 警告' },
              { k: 'info', l: '🔵 提示' }
            ].map(it => (
              <button key={it.k}
                className={`nav-btn ${levelFilter === it.k ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => setLevelFilter(it.k as any)}>
                {it.l}
              </button>
            ))}
          </div>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 12 }}>类型:</span>
            <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="all">全部类型</option>
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 12 }}>状态:</span>
            {[
              { k: 'all', l: '全部' },
              { k: 'pending', l: '待确认' },
              { k: 'processing', l: '处理中' },
              { k: 'resolved', l: '已解决' }
            ].map(it => (
              <button key={it.k}
                className={`nav-btn ${statusFilter === it.k ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => setStatusFilter(it.k as any)}>
                {it.l}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-danger" onClick={() => setShowCreateModal(true)}>
              ➕ 上报新事件
            </button>
          </div>
        </div>
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: '1.2fr 1fr', flex: 1 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-title">📋 事件列表 ({filtered.length})</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>级别</th>
                  <th>类型</th>
                  <th>标题</th>
                  <th>位置</th>
                  <th>时间</th>
                  <th>状态</th>
                  <th style={{ width: 80 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const tl = typeLabels[a.type]
                  const ll = levelLabels[a.level]
                  return (
                    <tr key={a.id}
                      style={{
                        cursor: 'pointer',
                        background: selected?.id === a.id ? 'rgba(0, 212, 255, 0.08)' : undefined,
                        boxShadow: a.level === 'critical' && !a.resolved ? 'inset 3px 0 0 #ff0000' :
                          a.level === 'danger' && !a.resolved ? 'inset 3px 0 0 #ff4444' : undefined
                      }}
                      onClick={() => setSelected(a)}>
                      <td>
                        <span className="badge"
                          style={{
                            background: `${ll.color}22`, color: ll.color,
                            borderColor: ll.color,
                            animation: a.level === 'critical' && !a.resolved ? 'blink 0.8s infinite' : undefined
                          }}>
                          {ll.name}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: tl.color }}>
                        <span>{tl.icon}</span> <span>{tl.name}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
                          {a.title}
                          {!a.acknowledged && <span className="status-dot status-red" />}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#88a0c0' }}>📍 {a.location}</td>
                      <td style={{ fontSize: 11, color: '#88a0c0', fontFamily: 'Consolas' }}>
                        {timeAgo(a.createdAt)}
                      </td>
                      <td>
                        {!a.acknowledged && <span className="badge badge-red">待确认</span>}
                        {a.acknowledged && !a.resolved && <span className="badge badge-yellow">处理中</span>}
                        {a.resolved && <span className="badge badge-green">已解决</span>}
                      </td>
                      <td>
                        <div className="flex-row" style={{ gap: 4 }}>
                          {!a.acknowledged && (
                            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleAck(a) }}>
                              确认
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6680a0' }}>
                      <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
                      暂无符合条件的事件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-title">🔍 事件详情</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selected ? (
              <div className="flex-col" style={{ gap: 14 }}>
                {(() => {
                  const ll = levelLabels[selected.level]
                  const tl = typeLabels[selected.type]
                  return (
                    <div style={{
                      padding: 16, background: `${ll.color}10`,
                      border: `1px solid ${ll.color}44`, borderRadius: 6
                    }}>
                      <div className="flex-row" style={{ alignItems: 'center', marginBottom: 8 }}>
                        <span className="badge" style={{
                          background: `${ll.color}33`, color: ll.color,
                          borderColor: ll.color, fontSize: 12, padding: '4px 12px'
                        }}>{ll.name}</span>
                        <span style={{ marginLeft: 10, fontSize: 20 }}>{tl.icon}</span>
                        <span style={{ marginLeft: 8, fontSize: 14, color: tl.color, fontWeight: 600 }}>{tl.name}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#e0e6f0', marginBottom: 8 }}>
                        {selected.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#b0c0d8', lineHeight: 1.7 }}>
                        {selected.description}
                      </div>
                    </div>
                  )
                })()}

                <table className="table" style={{ fontSize: 12 }}>
                  <tbody>
                    <tr><td style={{ width: 90, color: '#88a0c0' }}>发生时间</td><td>{formatTime(selected.createdAt)}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>位置</td><td>📍 {selected.location}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>所属区域</td><td>{eventZone?.name || '-'}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>确认时间</td><td style={{ color: selected.acknowledgedAt ? '#00ff88' : '#ffaa00' }}>{formatTime(selected.acknowledgedAt)}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>确认人</td><td>{operators.find(o => o.id === selected.acknowledgedBy)?.name || '-'}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>解决时间</td><td style={{ color: selected.resolvedAt ? '#00ff88' : undefined }}>{formatTime(selected.resolvedAt)}</td></tr>
                    <tr><td style={{ color: '#88a0c0' }}>处理人</td><td>{operators.find(o => o.id === selected.resolvedBy)?.name || '-'}</td></tr>
                  </tbody>
                </table>

                {(eventVehicle || eventCharger) && (
                  <div style={{
                    padding: 12, background: 'rgba(0, 136, 204, 0.08)',
                    border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 4
                  }}>
                    <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 8 }}>📎 关联对象</div>
                    {eventVehicle && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: '#6680a0' }}>关联车辆</div>
                        <div className="flex-row" style={{ alignItems: 'center', marginTop: 4 }}>
                          <span style={{
                            fontFamily: 'Consolas', fontSize: 14, fontWeight: 700,
                            color: '#00d4ff', background: 'rgba(0, 212, 255, 0.1)',
                            padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(0, 212, 255, 0.3)'
                          }}>{eventVehicle.plateNumber}</span>
                          <span style={{ marginLeft: 10, fontSize: 12, color: '#a0b0c8' }}>
                            🔋 {eventVehicle.batteryLevel.toFixed(0)}% · 👤 {eventVehicle.driverName}
                          </span>
                        </div>
                      </div>
                    )}
                    {eventCharger && (
                      <div>
                        <div style={{ fontSize: 11, color: '#6680a0' }}>关联充电桩</div>
                        <div className="flex-row" style={{ alignItems: 'center', marginTop: 4 }}>
                          <span style={{
                            fontFamily: 'Consolas', fontSize: 14, fontWeight: 700,
                            color: eventCharger.status === 'fault' ? '#ff4444' : '#00ff88',
                            background: `rgba(${eventCharger.status === 'fault' ? '255, 68, 68' : '0, 255, 136'}, 0.1)`,
                            padding: '4px 10px', borderRadius: 4,
                            border: `1px solid ${eventCharger.status === 'fault' ? '#ff4444' : '#00ff88'}44`
                          }}>{eventCharger.code}</span>
                          <span style={{ marginLeft: 10, fontSize: 12, color: '#a0b0c8' }}>
                            ⚡ {eventCharger.power}kW · 状态: {eventCharger.status === 'fault' ? `故障(${eventCharger.errorCode})` : '正常'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selected.resolution && (
                  <div style={{
                    padding: 12, background: 'rgba(0, 255, 136, 0.05)',
                    border: '1px solid rgba(0, 255, 136, 0.15)', borderRadius: 4
                  }}>
                    <div style={{ fontSize: 12, color: '#00ff88', marginBottom: 6, fontWeight: 600 }}>✅ 处理结果</div>
                    <div style={{ fontSize: 13, color: '#c0d0e0', lineHeight: 1.6 }}>{selected.resolution}</div>
                  </div>
                )}

                {!selected.resolved && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 8 }}>
                      💬 处理说明（<span style={{ color: '#ff4444' }}>*</span>）
                    </div>
                    <textarea className="textarea" style={{ width: '100%', minHeight: 80 }}
                      placeholder="请详细描述处理过程和结果..."
                      value={resolution} onChange={e => setResolution(e.target.value)} />
                    <div className="flex-row" style={{ gap: 8, marginTop: 10 }}>
                      {!selected.acknowledged && (
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleAck(selected)}>
                          ✅ 确认接单
                        </button>
                      )}
                      <button className="btn btn-success" style={{ flex: 1 }} onClick={handleResolve}>
                        🎯 标记解决
                      </button>
                      <button className="btn btn-warning">📞 通知现场</button>
                      <button className="btn btn-secondary" onClick={() => navigateToModule('broadcast')}>
                        📢 广播通知
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 8 }}>⚡ 快捷处置</div>
                  <div className="flex-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-secondary">联系司机</button>
                    <button className="btn btn-sm btn-secondary">通知维修</button>
                    <button className="btn btn-sm btn-secondary">派发拖车</button>
                    <button className="btn btn-sm btn-secondary">交通疏导</button>
                    <button className="btn btn-sm btn-secondary">升级上报</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 60, textAlign: 'center', color: '#6680a0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 14 }}>点击左侧事件列表查看详情</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setShowCreateModal(false)}
        >
          <div style={{
            background: '#0d1828', border: '1px solid rgba(255, 68, 68, 0.4)',
            borderRadius: 8, padding: 24, width: 480
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ff6644', marginBottom: 20 }}>
              🚨 上报新事件
            </div>
            <div className="flex-col" style={{ gap: 14 }}>
              <div className="flex-row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>事件类型</label>
                  <select className="input" style={{ width: '100%' }}
                    value={newEvent.type}
                    onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as EventType }))}>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>紧急级别</label>
                  <select className="input" value={newEvent.level}
                    onChange={e => setNewEvent(p => ({ ...p, level: e.target.value as AlertLevel }))}>
                    {Object.entries(levelLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>事件标题</label>
                <input className="input" style={{ width: '100%' }} placeholder="简短描述事件"
                  value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>详细描述</label>
                <textarea className="textarea" style={{ width: '100%' }}
                  value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>位置</label>
                <input className="input" style={{ width: '100%' }} placeholder="如：A区 A-05桩"
                  value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div className="flex-row" style={{ gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleCreate}>确认上报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Events
