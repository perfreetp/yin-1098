import { useMemo, useState } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader from '../components/PageHeader'
import { Vehicle } from '../types'

function Queue() {
  const {
    zones, entries, vehicles, chargers, currentOperator,
    callNextVehicle, forceDispatch, transferVehicle, createAlert
  } = useDispatchStore()

  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<string>('all')
  const [selectedQueueType, setSelectedQueueType] = useState<string>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showDispatchModal, setShowDispatchModal] = useState(false)

  const queueTypes = [
    { key: 'all', name: '全部功率' },
    { key: 'power_30kw', name: '30kW 慢充' },
    { key: 'power_60kw', name: '60kW 标准' },
    { key: 'power_120kw', name: '120kW 快充' },
    { key: 'power_180kw', name: '180kW 超充' },
    { key: 'power_240kw', name: '240kW 特快' }
  ]

  const allQueues = useMemo(() => {
    const list: any[] = []
    zones.forEach(z => {
      if (selectedZone !== 'all' && selectedZone !== z.id) return
      z.queues.forEach(q => {
        if (selectedQueueType !== 'all' && selectedQueueType !== q.type) return
        list.push({ ...q, zoneName: z.name, zoneCode: z.code, zoneColor: z.color })
      })
    })
    return list
  }, [zones, selectedZone, selectedQueueType])

  const queuingByQueue = useMemo(() => {
    const map: Record<string, Vehicle[]> = {}
    vehicles.filter(v => v.status === 'queuing').forEach(v => {
      if (selectedEntry !== 'all') {
        const matchZone = zones.find(z => z.queues.some(q => q.id === v.currentQueue && q.entryId === selectedEntry))
        if (!matchZone) return
      }
      const key = v.currentQueue
      if (!map[key]) map[key] = []
      map[key].push(v)
    })
    Object.values(map).forEach(list => {
      list.sort((a, b) => b.priority - a.priority || a.queuePosition - b.queuePosition)
    })
    return map
  }, [vehicles, selectedEntry, zones])

  const availableChargersByZone = useMemo(() => {
    const map: Record<string, typeof chargers> = {}
    chargers.filter(c => c.status === 'available').forEach(c => {
      if (!map[c.zoneId]) map[c.zoneId] = []
      map[c.zoneId].push(c)
    })
    return map
  }, [chargers])

  const movingVehicles = vehicles.filter(v => v.status === 'moving')
  const chargingVehicles = vehicles.filter(v => v.status === 'charging')

  const formatTime = (d: Date) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    return `${Math.floor(mins / 60)}小时${mins % 60}分前`
  }

  const formatWait = (d: Date) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    return `${mins}分钟`
  }

  const priorityLabel = (p: number) => {
    if (p >= 3) return { text: '特急', color: '#ff4444' }
    if (p >= 2) return { text: '优先', color: '#ffaa00' }
    return { text: '普通', color: '#00d4ff' }
  }

  const handleCallNext = (queueId: string) => {
    const v = callNextVehicle(queueId)
    if (v) {
      alert(`叫号成功：${v.plateNumber} 请前往指定充电桩`)
    } else {
      alert('队列已空或无可用充电桩')
    }
  }

  const handleForceDispatch = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDispatchModal(true)
  }

  const confirmDispatch = (chargerId: string) => {
    if (!selectedVehicle) return
    const success = forceDispatch(selectedVehicle.id, chargerId)
    if (success) {
      alert(`强制调度成功：${selectedVehicle.plateNumber}`)
    } else {
      alert('调度失败，请检查充电桩状态')
    }
    setShowDispatchModal(false)
    setSelectedVehicle(null)
  }

  return (
    <div className="page-container">
      <PageHeader currentPage="queue" title="分区队列管理" />

      <div className="card" style={{ padding: 12 }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 13 }}>区域：</span>
            <select className="select" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
              <option value="all">全部区域</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 13 }}>入口：</span>
            <select className="select" value={selectedEntry} onChange={e => setSelectedEntry(e.target.value)}>
              <option value="all">全部入口</option>
              {entries.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#88a0c0', fontSize: 13 }}>功率：</span>
            <div className="flex-row" style={{ gap: 4 }}>
              {queueTypes.map(qt => (
                <button
                  key={qt.key}
                  className={`nav-btn ${selectedQueueType === qt.key ? 'active' : ''}`}
                  style={{ padding: '5px 12px' }}
                  onClick={() => setSelectedQueueType(qt.key)}
                >
                  {qt.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 12 }}>
            <span>🚦 总队列: <b style={{ color: '#00d4ff' }}>{Object.values(queuingByQueue).reduce((s, a) => s + a.length, 0)}</b></span>
            <span>🚗 行驶中: <b style={{ color: '#ffaa00' }}>{movingVehicles.length}</b></span>
            <span>🔋 充电中: <b style={{ color: '#00ff88' }}>{chargingVehicles.length}</b></span>
            <span>🔌 可用桩: <b style={{ color: chargers.filter(c => c.status === 'available').length > 10 ? '#00ff88' : '#ffaa00' }}>{chargers.filter(c => c.status === 'available').length}</b></span>
          </div>
        </div>
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr' }}>
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">🚦 排队队列一览</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div className="flex-col" style={{ gap: 12 }}>
              {allQueues.map(queue => {
                const queueVehicles = queuingByQueue[queue.id] || []
                const pct = Math.min(100, queueVehicles.length / Math.max(queue.maxLength, 1) * 100)
                const statusColor = queueVehicles.length >= queue.maxLength ? '#ff4444' : pct > 70 ? '#ffaa00' : '#00ff88'
                const entryName = entries.find(e => e.id === queue.entryId)?.name || '通用'
                const availableCount = availableChargersByZone[queue.zoneId]?.length || 0

                return (
                  <div key={queue.id} style={{
                    background: 'rgba(0, 80, 160, 0.08)',
                    border: `1px solid ${queue.zoneColor}33`,
                    borderRadius: 6, padding: 14
                  }}>
                    <div className="flex-row" style={{ alignItems: 'center', marginBottom: 10 }}>
                      <div style={{
                        padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: `${queue.zoneColor}22`, color: queue.zoneColor,
                        border: `1px solid ${queue.zoneColor}55`
                      }}>
                        {queue.zoneCode}区
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e6f0', marginLeft: 8 }}>
                        {queue.name}
                      </div>
                      <span className="tag" style={{ marginLeft: 8 }}>{entryName}</span>
                      <span className="tag" style={{ marginLeft: 4 }}>车道{queue.laneId.split('_')[1]}</span>
                      <span className={`status-dot ${pct > 80 ? 'status-red' : pct > 50 ? 'status-yellow' : 'status-green'}`} />
                      <span style={{ fontSize: 12, color: statusColor }}>
                        {queueVehicles.length}/{queue.maxLength} 辆
                      </span>
                      <div style={{ flex: 1, marginLeft: 16, maxWidth: 150 }}>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: pct + '%', background: statusColor }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#88a0c0', marginRight: 16 }}>
                        平均等待 {queue.averageWaitTime}分钟
                      </span>
                      <span style={{ fontSize: 11, color: '#00ff88', marginRight: 16 }}>
                        可用桩 {availableCount}
                      </span>
                      <div className="flex-row" style={{ gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleCallNext(queue.id)}>
                          ▶ 叫号
                        </button>
                        <button className="btn btn-sm btn-secondary">
                          批量叫号
                        </button>
                      </div>
                    </div>

                    {queueVehicles.length > 0 ? (
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 8
                      }}>
                        {queueVehicles.slice(0, 10).map((v, idx) => {
                          const pri = priorityLabel(v.priority)
                          const waitTime = formatWait(v.entryTime)
                          return (
                            <div key={v.id}
                              style={{
                                padding: '10px 12px', background: 'rgba(10, 20, 35, 0.8)',
                                border: `1px solid ${idx < 3 ? '#00d4ff' : 'rgba(140, 160, 200, 0.15)'}`,
                                borderRadius: 4, cursor: 'pointer',
                                boxShadow: idx < 3 ? '0 0 8px rgba(0, 212, 255, 0.15)' : 'none'
                              }}
                              onClick={() => setSelectedVehicle(v)}
                            >
                              <div className="flex-row" style={{ alignItems: 'center', marginBottom: 6 }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: idx === 0 ? '#00d4ff' : idx < 3 ? '#ffaa00' : 'rgba(100,120,160,0.3)',
                                  color: idx < 3 ? '#000' : '#a0b0c8',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{
                                  fontFamily: 'Consolas', fontSize: 14, fontWeight: 700,
                                  marginLeft: 6, color: '#e0e6f0'
                                }}>
                                  {v.plateNumber}
                                </span>
                                <span className="badge" style={{
                                  marginLeft: 'auto', background: `${pri.color}22`,
                                  color: pri.color, borderColor: pri.color
                                }}>
                                  {pri.text}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: '#88a0c0', lineHeight: 1.6 }}>
                                <div>👤 {v.driverName} · 🔋 {v.batteryLevel}%</div>
                                <div>⏱ 入场 {formatTime(v.entryTime)} · 等待 {waitTime}</div>
                                <div>⚡ 需求 {v.requiredPower}kW · 预计 {v.expectedChargeTime}分钟</div>
                              </div>
                              {v.remark && (
                                <div style={{
                                  marginTop: 6, padding: '3px 8px', background: 'rgba(255, 170, 0, 0.12)',
                                  color: '#ffaa00', borderRadius: 3, fontSize: 10
                                }}>
                                  {v.remark}
                                </div>
                              )}
                              <div className="flex-row" style={{ marginTop: 8, gap: 4 }}>
                                <button className="btn btn-sm btn-success" style={{ flex: 1 }}
                                  onClick={(e) => { e.stopPropagation(); handleCallNext(queue.id) }}>
                                  叫号
                                </button>
                                <button className="btn btn-sm btn-warning" style={{ flex: 1 }}
                                  onClick={(e) => { e.stopPropagation(); handleForceDispatch(v) }}>
                                  强制调度
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        {queueVehicles.length > 10 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 10, border: '1px dashed rgba(140, 160, 200, 0.2)',
                            borderRadius: 4, color: '#88a0c0', fontSize: 12, cursor: 'pointer'
                          }}>
                            还有 {queueVehicles.length - 10} 辆车...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        padding: 20, textAlign: 'center', color: '#6680a0',
                        border: '1px dashed rgba(140, 160, 200, 0.15)', borderRadius: 4, fontSize: 12
                      }}>
                        📭 当前队列为空
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-col" style={{ gap: 16, overflow: 'hidden' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">🚗 车辆详情</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {selectedVehicle ? (
                <div className="flex-col" style={{ gap: 12 }}>
                  <div style={{
                    padding: 16, background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2), rgba(0, 212, 255, 0.05))',
                    borderRadius: 6, border: '1px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    <div style={{
                      fontFamily: 'Consolas', fontSize: 26, fontWeight: 700,
                      color: '#00d4ff', letterSpacing: 3, textAlign: 'center'
                    }}>
                      {selectedVehicle.plateNumber}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#88a0c0' }}>
                      {selectedVehicle.vehicleType === 'truck' ? '重型卡车' :
                        selectedVehicle.vehicleType === 'van' ? '货运面包车' :
                          selectedVehicle.vehicleType === 'bus' ? '大型客车' : '小型车辆'}
                    </div>
                  </div>

                  <table className="table" style={{ fontSize: 12 }}>
                    <tbody>
                      <tr><td style={{ color: '#88a0c0', width: 90 }}>司机</td><td>{selectedVehicle.driverName}</td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>电话</td><td style={{ fontFamily: 'Consolas' }}>{selectedVehicle.driverPhone}</td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>入场时间</td><td>{new Date(selectedVehicle.entryTime).toLocaleTimeString('zh-CN', { hour12: false })}</td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>等待时长</td><td style={{ color: '#ffaa00' }}>{formatWait(selectedVehicle.entryTime)}</td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>电量</td><td>
                        <div className="flex-row" style={{ alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, height: 10 }}>
                            <div className="progress-fill" style={{
                              width: selectedVehicle.batteryLevel + '%',
                              background: selectedVehicle.batteryLevel > 50 ? '#00ff88' : selectedVehicle.batteryLevel > 20 ? '#ffaa00' : '#ff4444'
                            }} />
                          </div>
                          <span style={{ fontFamily: 'Consolas', color: '#00d4ff' }}>{selectedVehicle.batteryLevel.toFixed(0)}%</span>
                        </div>
                      </td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>充电需求</td><td>{selectedVehicle.requiredPower}kW / 约{selectedVehicle.expectedChargeTime}分钟</td></tr>
                      <tr><td style={{ color: '#88a0c0' }}>优先级</td>
                        <td><span className="badge" style={{
                          background: `${priorityLabel(selectedVehicle.priority).color}22`,
                          color: priorityLabel(selectedVehicle.priority).color,
                          borderColor: priorityLabel(selectedVehicle.priority).color
                        }}>{priorityLabel(selectedVehicle.priority).text}</span>
                        </td>
                      </tr>
                      <tr><td style={{ color: '#88a0c0' }}>状态</td>
                        <td>
                          <span className="badge badge-blue">{selectedVehicle.status === 'queuing' ? '排队中' : selectedVehicle.status === 'moving' ? '行驶中' : selectedVehicle.status === 'charging' ? '充电中' : '已完成'}</span>
                        </td>
                      </tr>
                      {selectedVehicle.assignedCharger && (
                        <tr><td style={{ color: '#88a0c0' }}>分配桩</td>
                          <td style={{ fontFamily: 'Consolas', color: '#00ff88', fontWeight: 600 }}>
                            {selectedVehicle.assignedCharger.split('_').slice(-1)[0].toUpperCase()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="flex-row" style={{ gap: 8 }}>
                    <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleCallNext(selectedVehicle.currentQueue)}>
                      叫号
                    </button>
                    <button className="btn btn-warning" style={{ flex: 1 }} onClick={() => handleForceDispatch(selectedVehicle)}>
                      强制调度
                    </button>
                  </div>
                  <div className="flex-row" style={{ gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }}>转区调度</button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                      createAlert({
                        type: 'emergency', level: 'warning',
                        title: `调度员干预：${selectedVehicle.plateNumber}`,
                        description: `${currentOperator.name} 对车辆 ${selectedVehicle.plateNumber} 发起人工干预`,
                        location: selectedVehicle.zoneId,
                        vehicleId: selectedVehicle.id
                      })
                      alert('已上报事件中心')
                    }}>上报异常</button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 40, textAlign: 'center', color: '#6680a0', fontSize: 13
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🚛</div>
                  点击左侧队列中的车辆查看详情
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 280 }}>
            <div className="card-title">🔌 充电桩状态速览</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {zones.map(z => {
                const zoneChargers = chargers.filter(c => c.zoneId === z.id)
                const available = zoneChargers.filter(c => c.status === 'available').length
                const charging = zoneChargers.filter(c => c.status === 'charging').length
                const fault = zoneChargers.filter(c => c.status === 'fault').length
                return (
                  <div key={z.id} style={{ marginBottom: 10 }}>
                    <div className="flex-row" style={{ alignItems: 'center', marginBottom: 6 }}>
                      <span style={{
                        width: 3, height: 14, background: z.color, borderRadius: 2,
                        marginRight: 6
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: z.color }}>{z.code}区</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#88a0c0' }}>
                        <span style={{ color: '#00ff88' }}>空闲{available}</span> /
                        <span style={{ color: '#00d4ff', margin: '0 4px' }}>充电{charging}</span> /
                        <span style={{ color: '#ff4444' }}> 故障{fault}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {zoneChargers.slice(0, 12).map(c => {
                        const bg = c.status === 'available' ? '#00ff88' :
                          c.status === 'charging' ? '#00d4ff' :
                            c.status === 'occupied' ? '#ffaa00' :
                              c.status === 'fault' ? '#ff4444' : '#666'
                        return (
                          <div key={c.id} title={`${c.code} - ${c.power}kW`} style={{
                            width: 28, height: 28, borderRadius: 4, fontSize: 10,
                            background: `${bg}22`, border: `1px solid ${bg}`,
                            color: bg, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700
                          }}>
                            {c.code.slice(-2)}
                          </div>
                        )
                      })}
                      {zoneChargers.length > 12 && (
                        <span style={{ fontSize: 10, color: '#6680a0', alignSelf: 'center' }}>+{zoneChargers.length - 12}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showDispatchModal && selectedVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setShowDispatchModal(false)}
        >
          <div style={{
            background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.4)',
            borderRadius: 8, padding: 24, width: 520, maxHeight: '80vh', overflow: 'auto'
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#00d4ff', marginBottom: 16 }}>
              强制调度 - {selectedVehicle.plateNumber}
            </div>
            <div style={{ color: '#88a0c0', fontSize: 13, marginBottom: 16 }}>
              请选择目标充电桩（将覆盖原有分配）
            </div>
            <div className="flex-col" style={{ gap: 12 }}>
              {zones.map(z => {
                const zChargers = chargers.filter(c => c.zoneId === z.id && (c.status === 'available' || c.status === 'occupied'))
                return (
                  <div key={z.id}>
                    <div style={{ fontSize: 12, color: z.color, fontWeight: 600, marginBottom: 6 }}>
                      {z.name}（{zChargers.length}可用）
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {zChargers.map(c => (
                        <button key={c.id}
                          style={{
                            padding: '8px 4px', borderRadius: 4, cursor: 'pointer',
                            background: c.status === 'available' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                            border: `1px solid ${c.status === 'available' ? '#00ff88' : '#ffaa00'}55`,
                            color: c.status === 'available' ? '#00ff88' : '#ffaa00',
                            fontSize: 12, fontFamily: 'Consolas', fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onClick={() => confirmDispatch(c.id)}
                          onMouseEnter={e => {
                            (e.target as HTMLElement).style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={e => {
                            (e.target as HTMLElement).style.transform = 'scale(1)'
                          }}
                        >
                          {c.code}<br />
                          <span style={{ fontSize: 10, opacity: 0.7 }}>{c.power}kW {c.status === 'occupied' ? '(占)' : ''}</span>
                        </button>
                      ))}
                      {zChargers.length === 0 && (
                        <span style={{ gridColumn: '1 / -1', padding: 10, textAlign: 'center', color: '#6680a0', fontSize: 11 }}>
                          暂无可分配充电桩
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Queue
