import { useMemo } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader from '../components/PageHeader'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

function Dashboard() {
  const {
    vehicles, chargers, zones, roads, alerts, entries, strategies, currentStrategy
  } = useDispatchStore()

  const stats = useMemo(() => {
    const queuing = vehicles.filter(v => v.status === 'queuing').length
    const charging = vehicles.filter(v => v.status === 'charging' || v.status === 'completed').length
    const moving = vehicles.filter(v => v.status === 'moving').length
    const available = chargers.filter(c => c.status === 'available').length
    const totalPower = chargers.filter(c => c.status === 'charging').reduce((s, c) => s + c.powerOutput, 0)
    const unresovled = alerts.filter(a => !a.resolved).length
    const critical = alerts.filter(a => a.level === 'critical' && !a.resolved).length
    const danger = alerts.filter(a => a.level === 'danger' && !a.resolved).length
    const totalThroughput = entries.reduce((s, e) => s + e.throughputToday, 0)
    return { queuing, charging, moving, available, totalPower, unresovled, critical, danger, totalThroughput }
  }, [vehicles, chargers, alerts, entries])

  const hourlyData = [
    { hour: '00', vehicles: 32, kwh: 820 },
    { hour: '02', vehicles: 18, kwh: 460 },
    { hour: '04', vehicles: 15, kwh: 380 },
    { hour: '06', vehicles: 48, kwh: 1200 },
    { hour: '08', vehicles: 126, kwh: 3800 },
    { hour: '10', vehicles: 152, kwh: 4600 },
    { hour: '12', vehicles: 186, kwh: 5800 },
    { hour: '14', vehicles: 165, kwh: 5100 },
    { hour: '16', vehicles: 178, kwh: 5400 },
    { hour: '18', vehicles: 192, kwh: 6200 },
    { hour: '20', vehicles: 148, kwh: 4500 },
    { hour: '22', vehicles: 85, kwh: 2400 }
  ]

  const zonePieData = zones.map(z => ({
    name: z.code + '区',
    value: z.chargingCount + z.availableCount,
    color: z.color
  }))

  const statusLabels: Record<string, string> = {
    queuing: '排队中', moving: '行驶中', charging: '充电中',
    completed: '充满待取', exiting: '离场中', fault: '故障'
  }

  const statusColors: Record<string, string> = {
    queuing: '#ffaa00', moving: '#00d4ff', charging: '#00ff88',
    completed: '#aa88ff', exiting: '#66aaff', fault: '#ff4444'
  }

  const chargerStatusLabels: Record<string, string> = {
    available: '空闲', occupied: '占用', charging: '充电中',
    fault: '故障', maintenance: '维护'
  }

  const chargerStatusColors: Record<string, string> = {
    available: '#00ff88', occupied: '#ffaa00', charging: '#00d4ff',
    fault: '#ff4444', maintenance: '#aa88ff'
  }

  const vehicleTypeMap: Record<string, string> = {
    truck: '🚚', van: '🚐', bus: '🚌', small: '🚗'
  }

  const strategy = strategies.find(s => s.type === currentStrategy)

  return (
    <div className="page-container">
      <PageHeader currentPage="dashboard" title="总控大盘" />

      <div className="flex-row" style={{ marginBottom: 0 }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>📋</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#00d4ff' }}>{stats.totalThroughput}</div>
              <div className="stat-label">今日总吞吐量（辆次）</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>⚡</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#00ff88' }}>{stats.totalPower.toFixed(0)}<span style={{ fontSize: 18 }}>kW</span></div>
              <div className="stat-label">实时输出功率</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>🚛</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#ffaa00' }}>{stats.queuing}</div>
              <div className="stat-label">当前排队车辆</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>🔋</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: '#00ff88' }}>{stats.charging}</div>
              <div className="stat-label">正在充电 / 待取</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>🔌</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: stats.available > 10 ? '#00ff88' : '#ffaa00' }}>{stats.available}<span style={{ fontSize: 18 }}>/{chargers.length}</span></div>
              <div className="stat-label">可用充电桩</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>{stats.critical > 0 ? '🚨' : stats.danger > 0 ? '⚠️' : '✅'}</div>
            <div style={{ marginLeft: 12 }}>
              <div className="stat-value" style={{ color: stats.critical > 0 ? '#ff4444' : stats.danger > 0 ? '#ffaa00' : '#00ff88' }}>{stats.unresovled}</div>
              <div className="stat-label">待处理事件 {stats.critical > 0 && <span style={{ color: '#ff4444' }}>(紧急{stats.critical})</span>}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', flex: 1 }}>
        <div className="card" style={{ gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-title">
            🗺️ 场站实时地图
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 11, fontWeight: 'normal', color: '#88a0c0' }}>
              {Object.entries(statusLabels).map(([k, v]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[k], display: 'inline-block' }} />
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div style={{
            flex: 1, position: 'relative', background: 'linear-gradient(135deg, #0d1828 0%, #0a1420 100%)',
            borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0, 212, 255, 0.15)'
          }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 212, 255, 0.06)" strokeWidth="1" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="1000" height="800" fill="url(#grid)" />

              {roads.map(r => {
                const congestionColors = ['#00ff88', '#88cc88', '#ffcc00', '#ff8800', '#ff4444']
                return (
                  <g key={r.id}>
                    <line
                      x1={r.startX} y1={r.startY} x2={r.endX} y2={r.endY}
                      stroke={congestionColors[r.congestionLevel]} strokeWidth={r.congestionLevel > 2 ? 18 : 14}
                      strokeLinecap="round" opacity={0.25}
                    />
                    <line
                      x1={r.startX} y1={r.startY} x2={r.endX} y2={r.endY}
                      stroke={congestionColors[r.congestionLevel]} strokeWidth="2"
                      strokeDasharray={r.direction === 'one_way' ? '8 4' : '0'}
                      strokeLinecap="round" opacity={0.8} filter="url(#glow)"
                    />
                    <text x={(r.startX + r.endX) / 2} y={(r.startY + r.endY) / 2 - 8}
                      fill="rgba(200, 220, 240, 0.5)" fontSize="10" textAnchor="middle">
                      {r.name}（{r.vehicleCount}辆）
                    </text>
                  </g>
                )
              })}

              {zones.map(z => (
                <g key={z.id}>
                  <rect
                    x={z.mapX} y={z.mapY} width={z.mapWidth} height={z.mapHeight}
                    fill={z.color} fillOpacity={0.08} stroke={z.color} strokeWidth="2"
                    strokeDasharray="6 3" rx={8}
                  />
                  <text x={z.mapX + 12} y={z.mapY + 24} fill={z.color} fontSize="15" fontWeight="bold">
                    {z.name}
                  </text>
                  <text x={z.mapX + z.mapWidth - 12} y={z.mapY + 24} fill="#c0d0e0" fontSize="11" textAnchor="end">
                    ⚡{z.chargingCount}/空闲{z.availableCount}/故障{z.faultCount}
                  </text>
                </g>
              ))}

              {chargers.map(c => {
                const color = chargerStatusColors[c.status]
                const isGlow = c.status === 'charging' || c.status === 'fault'
                return (
                  <g key={c.id} transform={`translate(${c.mapX}, ${c.mapY})`}>
                    {isGlow && (
                      <rect x="-16" y="-16" width="32" height="32" rx="6"
                        fill={color} opacity={0.2}>
                        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
                      </rect>
                    )}
                    <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#0d1828" stroke={color} strokeWidth="2" />
                    <text x="0" y="4" fill={color} fontSize="11" textAnchor="middle" fontWeight="bold">{c.code}</text>
                    {c.status === 'charging' && (
                      <g transform="translate(-14, 18)">
                        <rect width="28" height="5" fill="rgba(0,0,0,0.6)" rx="2" />
                        <rect width={(28 * c.chargingProgress / 100)} height="5" fill={color} rx="2" />
                      </g>
                    )}
                    <title>{`${c.code} (${c.power}kW) - ${chargerStatusLabels[c.status]}${c.status === 'charging' ? ` ${c.chargingProgress}%` : ''}`}</title>
                  </g>
                )
              })}

              {vehicles.slice(0, 35).map(v => {
                const color = statusColors[v.status]
                const size = v.vehicleType === 'bus' ? 18 : v.vehicleType === 'truck' ? 16 : 12
                return (
                  <g key={v.id} transform={`translate(${v.mapX}, ${v.mapY})`}
                    style={{ transition: 'transform 0.8s ease' }}>
                    <circle r={size + 3} fill={color} opacity={0.2} />
                    <circle r={size} fill="#0d1828" stroke={color} strokeWidth="2" />
                    <text y="4" fontSize={size > 14 ? 12 : 10} textAnchor="middle">
                      {vehicleTypeMap[v.vehicleType]}
                    </text>
                    {v.priority > 1 && (
                      <text x={size} y={-size} fontSize="9" fill="#ff6644" fontWeight="bold">★</text>
                    )}
                    <title>{`${v.plateNumber} - ${statusLabels[v.status]}${v.remark ? ' (' + v.remark + ')' : ''}`}</title>
                  </g>
                )
              })}
            </svg>

            <div style={{
              position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, flexDirection: 'column'
            }}>
              {entries.map(e => (
                <div key={e.id} style={{
                  padding: '6px 10px',
                  background: 'rgba(10, 20, 35, 0.85)',
                  border: `1px solid ${e.alertLevel === 'warning' ? '#ffaa00' : 'rgba(0, 212, 255, 0.3)'}`,
                  borderRadius: 4, fontSize: 12
                }}>
                  <span className={`status-dot ${e.status === 'open' ? 'status-green' : e.status === 'partial' ? 'status-yellow' : 'status-gray'}`} />
                  <span style={{ color: '#c0d0e0' }}>{e.name}</span>
                  <span style={{ marginLeft: 8, color: '#00d4ff', fontFamily: 'Consolas' }}>{e.throughputToday}辆</span>
                </div>
              ))}
            </div>

            {strategy && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12, padding: '8px 14px',
                background: 'rgba(10, 20, 35, 0.9)', border: `1px solid ${strategy.color}`,
                borderRadius: 6, fontSize: 12, maxWidth: 300
              }}>
                <div style={{ color: strategy.color, fontWeight: 600, marginBottom: 4 }}>
                  {strategy.icon} 当前策略：{strategy.name}
                </div>
                <div style={{ color: '#88a0c0', fontSize: 11, lineHeight: 1.5 }}>
                  {strategy.description}
                </div>
              </div>
            )}

            <div style={{
              position: 'absolute', bottom: 12, right: 12, padding: '8px 12px',
              background: 'rgba(10, 20, 35, 0.85)',
              border: '1px solid rgba(140, 160, 200, 0.2)', borderRadius: 4, fontSize: 11, color: '#88a0c0'
            }}>
              车辆: {vehicles.length}辆 | 充电桩: {chargers.length}台 | 刷新: 实时
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-title">📊 今日趋势</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorVeh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                <XAxis dataKey="hour" stroke="#6680a0" fontSize={11} />
                <YAxis stroke="#6680a0" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4, color: '#e0e6f0' }}
                  labelStyle={{ color: '#00d4ff' }}
                />
                <Area type="monotone" dataKey="vehicles" stroke="#00d4ff" fillOpacity={1} fill="url(#colorVeh)" name="车辆数" />
                <Area type="monotone" dataKey="kwh" stroke="#00ff88" fillOpacity={1} fill="url(#colorKwh)" name="用电量(kWh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-col" style={{ gap: 16, overflow: 'hidden' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📈 区域分布</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={zonePieData}
                    innerRadius={40} outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {zonePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 8, gap: 8 }}>
                {zones.map(z => {
                  const total = z.chargerCount
                  const util = Math.round((z.chargingCount + z.availableCount > 0 ? z.chargingCount / total : 0) * 100)
                  return (
                    <div key={z.id}>
                      <div className="flex-row" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, background: z.color, borderRadius: 2, marginTop: 4 }} />
                        <span style={{ flex: 1, fontSize: 12, color: '#c0d0e0' }}>{z.code}区</span>
                        <span style={{ fontFamily: 'Consolas', color: z.color, fontSize: 12 }}>{util}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: util + '%', background: z.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">
              ⚠️ 实时预警
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => window.location.hash = 'events'}>查看全部 →</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {alerts.filter(a => !a.resolved).slice(0, 6).map(a => {
                const levelColor = a.level === 'critical' ? '#ff0000' : a.level === 'danger' ? '#ff4444' : a.level === 'warning' ? '#ffaa00' : '#00d4ff'
                const levelLabel = a.level === 'critical' ? '紧急' : a.level === 'danger' ? '严重' : a.level === 'warning' ? '警告' : '提示'
                const minutes = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000)
                return (
                  <div key={a.id} style={{
                    padding: '10px 12px', marginBottom: 8,
                    background: `${levelColor}12`, borderLeft: `3px solid ${levelColor}`,
                    borderRadius: 4, cursor: 'pointer'
                  }}
                    onClick={() => window.location.hash = 'events'}
                  >
                    <div className="flex-row" style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: `${levelColor}22`, color: levelColor, borderColor: levelColor }}>{levelLabel}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e6f0' }}>{a.title}</span>
                      {!a.acknowledged && <span className="status-dot status-red" />}
                    </div>
                    <div style={{ fontSize: 11, color: '#88a0c0', lineHeight: 1.5 }}>{a.description}</div>
                    <div style={{ marginTop: 6, fontSize: 10, color: '#6680a0' }}>
                      📍 {a.location} · ⏱ {minutes > 60 ? Math.floor(minutes / 60) + '小时' : minutes + '分钟'}前
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
