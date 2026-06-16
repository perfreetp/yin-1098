import { useState, useMemo } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader from '../components/PageHeader'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

function Review() {
  const { zones, chargers, alerts, operators, operationLogs, shiftStats, vehicles, strategies, currentStrategy,
    historyReports, generateDailyReport, generateWeeklyReport, downloadReport, previewReport } = useDispatchStore()

  const [period, setPeriod] = useState<'shift' | 'day' | 'week' | 'custom'>('shift')
  const [tab, setTab] = useState<'overview' | 'zone' | 'charger' | 'operator' | 'event' | 'report'>('overview')

  const hourlyData = useMemo(() => [
    { hour: '08', in: 42, out: 38, kwh: 1280 },
    { hour: '09', in: 86, out: 72, kwh: 2580 },
    { hour: '10', in: 128, out: 115, kwh: 3840 },
    { hour: '11', in: 172, out: 158, kwh: 5160 },
    { hour: '12', in: 186, out: 168, kwh: 5800 },
    { hour: '13', in: 158, out: 172, kwh: 4740 },
    { hour: '14', in: 165, out: 158, kwh: 4950 },
    { hour: '15', in: 155, out: 148, kwh: 4650 },
    { hour: '16', in: 178, out: 165, kwh: 5340 },
    { hour: '17', in: 192, out: 182, kwh: 5760 },
    { hour: '18', in: 168, out: 175, kwh: 5040 },
    { hour: '19', in: 125, out: 138, kwh: 3750 }
  ], [])

  const radarData = zones.map(z => {
    const zcs = chargers.filter(c => c.zoneId === z.id)
    const utilization = zcs.length ? Math.round(zcs.reduce((s, c) => s + c.utilizationRate, 0) / zcs.length) : 0
    return {
      area: z.code + '区',
      吞吐量: z.chargingCount * 15,
      利用率: utilization,
      周转率: 60 + Math.floor(Math.random() * 30),
      满意度: 80 + Math.floor(Math.random() * 15),
      效率: 70 + Math.floor(Math.random() * 25)
    }
  })

  const eventChartData = useMemo(() => {
    const types = ['congestion', 'reverse', 'occupying', 'vehicle_fault', 'charger_fault', 'driver_missing', 'emergency']
    const labels: Record<string, string> = {
      congestion: '拥堵', reverse: '逆行', occupying: '占用',
      vehicle_fault: '车辆故障', charger_fault: '桩故障',
      driver_missing: '失联', emergency: '紧急'
    }
    return types.map(t => ({
      type: labels[t],
      count: alerts.filter(a => a.type === t).length,
      resolved: alerts.filter(a => a.type === t && a.resolved).length
    }))
  }, [alerts])

  const operatorData = operators.map(op => ({
    name: op.name,
    操作数: op.operationCount,
    处理事件: op.resolvedEvents,
    响应速度: 80 + Math.floor(Math.random() * 20)
  }))

  const COLORS = ['#00d4ff', '#00ff88', '#ffaa00', '#ff6688']

  const strategy = strategies.find(s => s.type === currentStrategy)

  const recentLogs = operationLogs.slice(0, 20)

  const exportReport = (type: 'daily' | 'weekly') => {
    let report
    if (type === 'daily') {
      report = generateDailyReport()
      alert(`日报生成成功！\n\n报表名称：${report.name}\n生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}\n文件大小：${report.fileSize}\n\n可在下方历史报表中预览或下载`)
    } else {
      report = generateWeeklyReport()
      alert(`周报生成成功！\n\n报表名称：${report.name}\n生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}\n文件大小：${report.fileSize}\n\n可在下方历史报表中预览或下载`)
    }
  }

  return (
    <div className="page-container">
      <PageHeader currentPage="review" title="班次复盘分析" />

      <div className="card" style={{ padding: 12 }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div className="nav-buttons">
            {[
              { k: 'overview', l: '📊 运营总览' },
              { k: 'zone', l: '🗺️ 区域分析' },
              { k: 'charger', l: '🔌 桩利用率' },
              { k: 'operator', l: '👥 人员绩效' },
              { k: 'event', l: '⚠️ 事件统计' },
              { k: 'report', l: '📋 报表导出' }
            ].map(it => (
              <button key={it.k}
                className={`nav-btn ${tab === it.k ? 'active' : ''}`}
                onClick={() => setTab(it.k as any)}>
                {it.l}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: '#88a0c0', fontSize: 12 }}>统计周期:</span>
            {['shift', 'day', 'week', 'custom'].map(p => (
              <button key={p}
                className={`nav-btn ${period === p ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => setPeriod(p as any)}>
                {p === 'shift' ? '当前班次' : p === 'day' ? '今日' : p === 'week' ? '本周' : '自定义'}
              </button>
            ))}
            {strategy && (
              <span className="tag" style={{ background: `${strategy.color}18`, color: strategy.color, borderColor: `${strategy.color}55`, padding: '4px 10px' }}>
                {strategy.icon} {strategy.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {tab === 'overview' && shiftStats && (
        <>
          <div className="flex-row" style={{ gap: 16 }}>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex-row" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: 42 }}>🚛</div>
                <div style={{ marginLeft: 12 }}>
                  <div className="stat-value" style={{ color: '#00d4ff' }}>{shiftStats.totalVehicles}</div>
                  <div className="stat-label">总服务车辆（辆次）</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#88a0c0' }}>
                完成充电: <span style={{ color: '#00ff88' }}>{shiftStats.totalCharged}</span> 辆 ·
                完成率: <span style={{ color: '#00d4ff' }}>{(shiftStats.totalCharged / shiftStats.totalVehicles * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex-row" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: 42 }}>⚡</div>
                <div style={{ marginLeft: 12 }}>
                  <div className="stat-value" style={{ color: '#00ff88' }}>{(shiftStats.totalKWh / 1000).toFixed(1)}<span style={{ fontSize: 18 }}>MWh</span></div>
                  <div className="stat-label">累计充电量</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#88a0c0' }}>
                峰值时段: <span style={{ color: '#ffaa00' }}>{shiftStats.peakHour}</span> ·
                峰值流量: <span style={{ color: '#ff6644' }}>{shiftStats.peakVolume}辆/时</span>
              </div>
            </div>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex-row" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: 42 }}>⏱️</div>
                <div style={{ marginLeft: 12 }}>
                  <div className="stat-value" style={{ color: '#ffaa00' }}>{shiftStats.averageWaitTime}<span style={{ fontSize: 18 }}>min</span></div>
                  <div className="stat-label">平均等待时长</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#88a0c0' }}>
                平均充电: <span style={{ color: '#00d4ff' }}>{shiftStats.averageChargeTime}min</span> ·
                平均周转: <span style={{ color: '#00ff88' }}>{shiftStats.averageTurnover}min</span>
              </div>
            </div>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex-row" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: 42 }}>⚠️</div>
                <div style={{ marginLeft: 12 }}>
                  <div className="stat-value" style={{ color: '#ff6644' }}>
                    {Object.values(shiftStats.eventsByType).reduce((s: number, n: any) => s + (typeof n === 'number' ? n : 0), 0)}
                  </div>
                  <div className="stat-label">累计事件</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#88a0c0' }}>
                拥堵: <span style={{ color: '#ffaa00' }}>{shiftStats.eventsByType.congestion}</span> ·
                故障: <span style={{ color: '#ff4444' }}>{(shiftStats.eventsByType.vehicle_fault as any) + (shiftStats.eventsByType.charger_fault as any)}</span>
              </div>
            </div>
          </div>

          <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr', flex: 1 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-title">📈 时段进出流量</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                    <XAxis dataKey="hour" stroke="#6680a0" fontSize={11} />
                    <YAxis stroke="#6680a0" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#88a0c0' }} />
                    <Area type="monotone" dataKey="in" name="进场" stroke="#00d4ff" fillOpacity={1} fill="url(#inG)" />
                    <Area type="monotone" dataKey="out" name="出场" stroke="#00ff88" fillOpacity={1} fill="url(#outG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-title">🗺️ 区域充电分布</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shiftStats.zoneStats.map((z: any) => ({ name: z.zoneName, value: z.kwh }))}
                      innerRadius={45} outerRadius={80}
                      paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name.split('-')[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {shiftStats.zoneStats.map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 260 }}>
              <div className="card-title">📝 主要问题与待办</div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div className="flex-col" style={{ gap: 8 }}>
                  {shiftStats.topAlerts.map((alert: string, idx: number) => (
                    <div key={idx} style={{
                      padding: '10px 12px', background: 'rgba(255, 170, 0, 0.05)',
                      border: '1px solid rgba(255, 170, 0, 0.15)', borderRadius: 4,
                      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(255, 170, 0, 0.2)', color: '#ffaa00',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700
                      }}>{idx + 1}</span>
                      <span style={{ flex: 1, color: '#c0d0e0' }}>{alert}</span>
                      <button className="btn btn-sm btn-secondary">处理</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 260 }}>
              <div className="card-title">🔧 最近调度操作</div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table className="table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>操作人</th>
                      <th>动作</th>
                      <th>对象</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontFamily: 'Consolas', color: '#88a0c0', fontSize: 11 }}>
                          {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
                        </td>
                        <td>{log.operatorName}</td>
                        <td style={{ color: '#00d4ff' }}>{log.action}</td>
                        <td style={{ fontSize: 11, color: '#a0b0c8' }}>{log.targetName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'zone' && (
        <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', flex: 1 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">🗺️ 区域能力雷达图</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(140, 160, 200, 0.15)" />
                  <PolarAngleAxis dataKey="area" stroke="#88a0c0" fontSize={12} />
                  <PolarRadiusAxis stroke="#6680a0" fontSize={10} />
                  {zones.map((z, idx) => (
                    <Radar key={z.id} name={z.code + '区'} dataKey={['吞吐量', '利用率', '周转率', '满意度', '效率'][idx % 5]}
                      stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.25} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📊 区域吞吐量对比</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftStats?.zoneStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis dataKey="zoneName" stroke="#6680a0" fontSize={10} />
                  <YAxis stroke="#6680a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="vehicles" name="服务车辆" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kwh" name="充电量(kWh)" fill="#00ff88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📋 区域详情</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>区域</th>
                    <th>服务车辆</th>
                    <th>充电量(kWh)</th>
                    <th>平均利用率</th>
                    <th>充电桩数</th>
                    <th>平均等待</th>
                    <th>平均周转</th>
                    <th>效能评级</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftStats?.zoneStats.map((zs: any, idx: number) => {
                    const zone = zones.find(z => z.id === zs.zoneId)
                    const rating = zs.avgUtilization >= 75 ? 'A' : zs.avgUtilization >= 60 ? 'B' : 'C'
                    const ratingColor = rating === 'A' ? '#00ff88' : rating === 'B' ? '#00d4ff' : '#ffaa00'
                    return (
                      <tr key={zs.zoneId}>
                        <td style={{ color: zone?.color, fontWeight: 600 }}>{zs.zoneName}</td>
                        <td style={{ fontFamily: 'Consolas', color: '#00d4ff' }}>{zs.vehicles}</td>
                        <td style={{ fontFamily: 'Consolas', color: '#00ff88' }}>{zs.kwh.toLocaleString()}</td>
                        <td>
                          <div className="flex-row" style={{ alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 100 }}>
                              <div className="progress-fill" style={{ width: zs.avgUtilization + '%', background: COLORS[idx % 4] }} />
                            </div>
                            <span style={{ fontFamily: 'Consolas', color: COLORS[idx % 4] }}>{zs.avgUtilization}%</span>
                          </div>
                        </td>
                        <td>{zone?.chargerCount}</td>
                        <td style={{ color: '#ffaa00' }}>{Math.floor(10 + Math.random() * 20)}分钟</td>
                        <td style={{ color: '#8fb8d8' }}>{Math.floor(70 + Math.random() * 40)}分钟</td>
                        <td>
                          <span style={{
                            display: 'inline-block', width: 30, height: 30, borderRadius: '50%',
                            background: `${ratingColor}22`, color: ratingColor,
                            border: `2px solid ${ratingColor}`, fontWeight: 700,
                            lineHeight: '26px', textAlign: 'center'
                          }}>{rating}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'charger' && (
        <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', flex: 1 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">⚡ 充电桩利用率TOP10</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargers.slice().sort((a, b) => b.utilizationRate - a.utilizationRate).slice(0, 10)}
                  layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis type="number" stroke="#6680a0" fontSize={11} />
                  <YAxis dataKey="code" type="category" stroke="#6680a0" fontSize={11} width={50} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Bar dataKey="utilizationRate" name="利用率%" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📉 充电桩利用率BOTTOM10</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargers.slice().sort((a, b) => a.utilizationRate - b.utilizationRate).slice(0, 10)}
                  layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis type="number" stroke="#6680a0" fontSize={11} />
                  <YAxis dataKey="code" type="category" stroke="#6680a0" fontSize={11} width={50} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Bar dataKey="utilizationRate" name="利用率%" fill="#ffaa00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📋 充电桩详情</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>功率</th>
                    <th>区域</th>
                    <th>状态</th>
                    <th>今日充电(kWh)</th>
                    <th>利用率</th>
                    <th>充电次数</th>
                    <th>温度</th>
                    <th>健康度</th>
                  </tr>
                </thead>
                <tbody>
                  {chargers.map(c => {
                    const zone = zones.find(z => z.id === c.zoneId)
                    const health = 95 - (c.status === 'fault' ? 50 : 0) - Math.floor(Math.random() * 10)
                    return (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'Consolas', color: '#00d4ff', fontWeight: 600 }}>{c.code}</td>
                        <td>{c.power}kW</td>
                        <td style={{ color: zone?.color }}>{zone?.code}区</td>
                        <td>
                          <span className={`badge ${c.status === 'available' ? 'badge-green' : c.status === 'charging' ? 'badge-blue' : c.status === 'fault' ? 'badge-red' : 'badge-yellow'}`}>
                            {c.status === 'available' ? '空闲' : c.status === 'charging' ? '充电' : c.status === 'fault' ? '故障' : '占用'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'Consolas', color: '#00ff88' }}>{c.totalChargedToday}</td>
                        <td>
                          <div className="flex-row" style={{ alignItems: 'center', gap: 6 }}>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div className="progress-fill" style={{
                                width: c.utilizationRate + '%',
                                background: c.utilizationRate > 70 ? '#00ff88' : c.utilizationRate > 40 ? '#00d4ff' : '#ffaa00'
                              }} />
                            </div>
                            <span style={{ fontFamily: 'Consolas', fontSize: 11 }}>{c.utilizationRate}%</span>
                          </div>
                        </td>
                        <td>{Math.floor(c.totalChargedToday / (c.power * 0.5)) + 5}</td>
                        <td style={{ color: c.temperature > 45 ? '#ff6644' : '#88a0c0' }}>{c.temperature}°C</td>
                        <td>
                          <span style={{ color: health > 85 ? '#00ff88' : health > 70 ? '#ffaa00' : '#ff4444' }}>
                            {health}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'operator' && (
        <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', flex: 1 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">👥 人员绩效对比</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operatorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis dataKey="name" stroke="#6680a0" fontSize={12} />
                  <YAxis stroke="#6680a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="操作数" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="处理事件" fill="#00ff88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">⚡ 响应速度趋势</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={operatorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis dataKey="name" stroke="#6680a0" fontSize={12} />
                  <YAxis stroke="#6680a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Line type="monotone" dataKey="响应速度" stroke="#ffaa00" strokeWidth={2} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📋 人员详情</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>调度员</th>
                    <th>角色</th>
                    <th>班次</th>
                    <th>状态</th>
                    <th>登录时间</th>
                    <th>操作数</th>
                    <th>处理事件</th>
                    <th>平均响应</th>
                    <th>绩效评分</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => {
                    const score = Math.floor(70 + (op.operationCount / 3) + op.resolvedEvents * 2)
                    const scoreColor = score >= 90 ? '#00ff88' : score >= 75 ? '#00d4ff' : '#ffaa00'
                    return (
                      <tr key={op.id}>
                        <td style={{ fontWeight: 600 }}>
                          <span className={`status-dot ${op.status === 'online' ? 'status-green' : op.status === 'busy' ? 'status-yellow' : 'status-gray'}`} />
                          {op.name}
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {op.role === 'admin' ? '管理员' : op.role === 'supervisor' ? '主管' : op.role === 'dispatcher' ? '调度员' : '观察员'}
                          </span>
                        </td>
                        <td>{op.shift}</td>
                        <td style={{ color: op.status === 'online' ? '#00ff88' : op.status === 'busy' ? '#ffaa00' : '#888' }}>
                          {op.status === 'online' ? '在线' : op.status === 'busy' ? '忙碌' : '离线'}
                        </td>
                        <td style={{ fontFamily: 'Consolas', fontSize: 11, color: '#88a0c0' }}>
                          {new Date(op.loginTime).toLocaleTimeString('zh-CN', { hour12: false })}
                        </td>
                        <td style={{ fontFamily: 'Consolas', color: '#00d4ff' }}>{op.operationCount}</td>
                        <td style={{ fontFamily: 'Consolas', color: '#00ff88' }}>{op.resolvedEvents}</td>
                        <td style={{ color: '#ffaa00' }}>{Math.floor(30 + Math.random() * 60)}秒</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 10,
                            background: `${scoreColor}22`, color: scoreColor,
                            border: `1px solid ${scoreColor}55`, fontWeight: 700, fontSize: 12
                          }}>
                            {Math.min(score, 100)}分
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'event' && (
        <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', flex: 1 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">⚠️ 事件类型分布</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis dataKey="type" stroke="#6680a0" fontSize={11} />
                  <YAxis stroke="#6680a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="总数" fill="#ff6644" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="已解决" fill="#00ff88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📊 处理时效统计</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { t: '<1min', v: 8 }, { t: '1-5min', v: 22 }, { t: '5-10min', v: 35 },
                  { t: '10-30min', v: 18 }, { t: '30-60min', v: 7 }, { t: '>60min', v: 3 }
                ]}>
                  <defs>
                    <linearGradient id="respG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffaa00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 160, 200, 0.1)" />
                  <XAxis dataKey="t" stroke="#6680a0" fontSize={11} />
                  <YAxis stroke="#6680a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1828', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 4 }} />
                  <Area type="monotone" dataKey="v" name="事件数" stroke="#ffaa00" fillOpacity={1} fill="url(#respG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', padding: 20 }}>
            <div className="flex-row" style={{ gap: 16 }}>
              {[
                { label: '平均确认时长', value: '2分35秒', color: '#00d4ff', icon: '⏱️' },
                { label: '平均处理时长', value: '12分48秒', color: '#00ff88', icon: '🔧' },
                { label: '10分钟内响应率', value: '87.5%', color: '#ffaa00', icon: '⚡' },
                { label: '事件解决率', value: '74.2%', color: '#88ccff', icon: '✅' },
                { label: '重复发生率', value: '5.8%', color: '#ff6688', icon: '🔄' },
                { label: '司机满意度', value: '92.3%', color: '#aaff88', icon: '😊' }
              ].map((m, idx) => (
                <div key={idx} style={{
                  flex: 1, padding: 16,
                  background: `linear-gradient(135deg, ${m.color}15, transparent)`,
                  border: `1px solid ${m.color}33`, borderRadius: 6, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 28 }}>{m.icon}</div>
                  <div style={{ fontFamily: 'Consolas', fontSize: 22, fontWeight: 700, color: m.color, margin: '6px 0' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#88a0c0' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="flex-col" style={{ flex: 1, gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#00d4ff', marginBottom: 20 }}>
              📋 报表生成中心
            </div>
            <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{
                padding: 20, background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.15), transparent)',
                border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, cursor: 'pointer'
              }}
                onClick={() => exportReport('daily')}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e0e6f0', marginBottom: 6 }}>每日运营日报</div>
                <div style={{ fontSize: 12, color: '#88a0c0', lineHeight: 1.6, marginBottom: 14 }}>
                  包含当日吞吐量、利用率、周转率、事件统计、人员绩效、明日建议
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }}>生成日报 →</button>
              </div>

              <div style={{
                padding: 20, background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), transparent)',
                border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: 8, cursor: 'pointer'
              }}
                onClick={() => exportReport('weekly')}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e0e6f0', marginBottom: 6 }}>每周分析周报</div>
                <div style={{ fontSize: 12, color: '#88a0c0', lineHeight: 1.6, marginBottom: 14 }}>
                  周度趋势对比、区域排名、问题洞察、优化建议、下周预测
                </div>
                <button className="btn btn-success" style={{ width: '100%' }}>生成周报 →</button>
              </div>

              <div style={{
                padding: 20, background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.12), transparent)',
                border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: 8, cursor: 'pointer'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📑</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e0e6f0', marginBottom: 6 }}>自定义报表</div>
                <div style={{ fontSize: 12, color: '#88a0c0', lineHeight: 1.6, marginBottom: 14 }}>
                  按需选择时间范围、维度、指标，灵活生成个性化分析报表
                </div>
                <button className="btn btn-warning" style={{ width: '100%' }}>自定义配置 →</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📁 历史报表记录</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>报表名称</th>
                    <th>类型</th>
                    <th>周期</th>
                    <th>生成时间</th>
                    <th>生成人</th>
                    <th>大小</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {historyReports.map((r) => {
                    const rtype = r.type as any
                    return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>📄 {r.name}</td>
                      <td>
                        <span className={`badge ${rtype === 'daily' ? 'badge-blue' : rtype === 'weekly' ? 'badge-green' : rtype === 'monthly' ? 'badge-yellow' : 'badge-gray'}`}>
                          {rtype === 'daily' ? '日报' : rtype === 'weekly' ? '周报' : rtype === 'monthly' ? '月报' : '自定义'}
                        </span>
                      </td>
                      <td style={{ color: '#88a0c0', fontSize: 12 }}>{r.period}</td>
                      <td style={{ fontFamily: 'Consolas', color: '#88a0c0', fontSize: 11 }}>{new Date(r.generatedAt).toLocaleString('zh-CN', { hour12: false })}</td>
                      <td>{r.generatedBy}</td>
                      <td style={{ fontFamily: 'Consolas', fontSize: 11, color: '#a0b0c8' }}>{r.fileSize}</td>
                      <td>
                        <div className="flex-row" style={{ gap: 4 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => downloadReport(r.id)}>下载</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => previewReport(r.id)}>预览</button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Review
