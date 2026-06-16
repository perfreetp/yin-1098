import { useState } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader from '../components/PageHeader'
import { StrategyType } from '../types'

function Settings() {
  const { strategies, currentStrategy, setStrategy, zones, entries, operators, currentOperator, operationLogs } = useDispatchStore()

  const [tab, setTab] = useState<'strategy' | 'queue' | 'zone' | 'operator' | 'system' | 'logs'>('strategy')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [screenEnabled, setScreenEnabled] = useState(true)
  const [flashEnabled, setFlashEnabled] = useState(true)
  const [autoDispatch, setAutoDispatch] = useState(true)
  const [autoCallInterval, setAutoCallInterval] = useState(15)
  const [nightModeStart, setNightModeStart] = useState('22:00')
  const [nightModeEnd, setNightModeEnd] = useState('06:00')
  const [congestionThreshold, setCongestionThreshold] = useState(10)
  const [occupyingTimeout, setOccupyingTimeout] = useState(30)

  const logFiltered = operationLogs.slice(0, 50)

  return (
    <div className="page-container">
      <PageHeader currentPage="settings" title="系统设置中心" />

      <div className="grid-layout" style={{ gridTemplateColumns: '200px 1fr', flex: 1 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid rgba(0, 212, 255, 0.15)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#00d4ff' }}>⚙️ 设置菜单</div>
          </div>
          <div className="flex-col" style={{ gap: 2, padding: 10 }}>
            {[
              { k: 'strategy', l: '调度策略', i: '🎯' },
              { k: 'queue', l: '队列配置', i: '🚦' },
              { k: 'zone', l: '区域管理', i: '🗺️' },
              { k: 'operator', l: '人员权限', i: '👥' },
              { k: 'system', l: '系统参数', i: '🔧' },
              { k: 'logs', l: '操作审计', i: '📋' }
            ].map(it => (
              <button key={it.k}
                style={{
                  padding: '12px 14px', textAlign: 'left', borderRadius: 4,
                  background: tab === it.k ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  border: `1px solid ${tab === it.k ? 'rgba(0, 212, 255, 0.4)' : 'transparent'}`,
                  color: tab === it.k ? '#00d4ff' : '#88a0c0',
                  cursor: 'pointer', fontSize: 13, fontWeight: tab === it.k ? 600 : 400,
                  transition: 'all 0.2s'
                }}
                onClick={() => setTab(it.k as any)}>
                <span style={{ marginRight: 8 }}>{it.i}</span>{it.l}
              </button>
            ))}
          </div>

          <div style={{ padding: 14, borderTop: '1px solid rgba(0, 212, 255, 0.15)', marginTop: 'auto' }}>
            <div style={{ fontSize: 12, color: '#6680a0', marginBottom: 8 }}>当前登录</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0088cc, #00d4ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14
              }}>
                {currentOperator.name.charAt(0)}
              </div>
              <div>
                <div style={{ color: '#e0e6f0', fontSize: 13, fontWeight: 600 }}>{currentOperator.name}</div>
                <div style={{ fontSize: 11, color: '#6680a0' }}>
                  {currentOperator.role === 'admin' ? '系统管理员' : currentOperator.role === 'supervisor' ? '调度主管' : '调度员'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'strategy' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'auto' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>🎯 调度策略管理</div>
                <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 16 }}>
                  选择适合当前运营场景的调度策略，系统将按配置的优先级和规则自动调度
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {strategies.map(s => (
                    <div key={s.type}
                      style={{
                        padding: 18, background: currentStrategy === s.type ? `${s.color}12` : 'rgba(0, 80, 160, 0.05)',
                        border: `2px solid ${currentStrategy === s.type ? s.color : 'rgba(140, 160, 200, 0.15)'}`,
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.3s',
                        boxShadow: currentStrategy === s.type ? `0 0 24px ${s.color}22` : 'none'
                      }}
                      onClick={() => {
                        if (confirm(`确认切换到「${s.name}」策略吗？`)) {
                          setStrategy(s.type as StrategyType)
                        }
                      }}
                    >
                      <div className="flex-row" style={{ alignItems: 'center', marginBottom: 10 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: `${s.color}22`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 26, border: `1px solid ${s.color}44`
                        }}>{s.icon}</div>
                        <div style={{ marginLeft: 14 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.name}</div>
                          {currentStrategy === s.type && (
                            <span className="badge badge-green" style={{ marginTop: 4 }}>✓ 运行中</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#a0b0c8', lineHeight: 1.6, marginBottom: 12, minHeight: 40 }}>
                        {s.description}
                      </div>
                      <div style={{ padding: 10, background: 'rgba(0, 20, 40, 0.5)', borderRadius: 4, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#88a0c0', marginBottom: 6 }}>核心规则：</div>
                        <div className="flex-col" style={{ gap: 3 }}>
                          {s.specialRules.map((r, i) => (
                            <div key={i} style={{ fontSize: 11, color: '#c0d0e0' }}>• {r}</div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-row" style={{ gap: 8, fontSize: 11, color: '#88a0c0', flexWrap: 'wrap' }}>
                        {s.enableAutoDispatch && <span className="tag">🤖 自动调度</span>}
                        {s.enableVoiceBroadcast && <span className="tag">🔊 语音播报</span>}
                        {s.enableScreenDisplay && <span className="tag">📺 屏幕提示</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'queue' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'auto' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>🚦 队列规则配置</div>
                <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 16 }}>
                  配置各功率队列的长度限制、自动叫号时间、优先级排序规则
                </div>
              </div>

              <div style={{
                padding: 16, background: 'rgba(0, 136, 204, 0.06)',
                border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 6
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e6f0', marginBottom: 12 }}>⏱️ 叫号参数</div>
                <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>
                      自动叫号间隔（秒）
                    </label>
                    <input type="number" className="input" style={{ width: '100%' }}
                      value={autoCallInterval} onChange={e => setAutoCallInterval(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>
                      拥堵判定阈值（辆）
                    </label>
                    <input type="number" className="input" style={{ width: '100%' }}
                      value={congestionThreshold} onChange={e => setCongestionThreshold(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>
                      超时占用提醒（分钟）
                    </label>
                    <input type="number" className="input" style={{ width: '100%' }}
                      value={occupyingTimeout} onChange={e => setOccupyingTimeout(Number(e.target.value))} />
                  </div>
                </div>
                <div className="flex-row" style={{ gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px dashed rgba(0, 212, 255, 0.15)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoDispatch} onChange={e => setAutoDispatch(e.target.checked)} />
                    <span style={{ fontSize: 13, color: '#c0d0e0' }}>启用自动叫号</span>
                  </label>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e6f0', marginBottom: 10 }}>📋 各队列容量设置</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>队列类型</th>
                      <th>最大长度（辆）</th>
                      <th>拥堵阈值（%）</th>
                      <th>建议分流</th>
                      <th>启用状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { t: '30kW 慢充', m: 25, c: 70, d: '60kW区', e: true },
                      { t: '60kW 标准', m: 20, c: 75, d: '30kW/120kW', e: true },
                      { t: '120kW 快充', m: 15, c: 80, d: '180kW区', e: true },
                      { t: '180kW 超充', m: 12, c: 80, d: '120kW区', e: true },
                      { t: '240kW 特快', m: 10, c: 85, d: '180kW区', e: true },
                      { t: 'VIP 预约通道', m: 5, c: 90, d: '—', e: true }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{row.t}</td>
                        <td>
                          <input type="number" className="input" style={{ width: 80 }} defaultValue={row.m} />
                        </td>
                        <td>
                          <input type="number" className="input" style={{ width: 80 }} defaultValue={row.c} />
                        </td>
                        <td style={{ fontSize: 12, color: '#88a0c0' }}>{row.d}</td>
                        <td>
                          <span className={`badge ${row.e ? 'badge-green' : 'badge-gray'}`}>
                            {row.e ? '启用' : '禁用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'zone' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'auto' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>🗺️ 区域与入口管理</div>
                <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 16 }}>
                  配置各充电区域的基础信息、开放状态、关联入口及车道信息
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e6f0', marginBottom: 10 }}>🏢 充电区域</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {zones.map(z => (
                    <div key={z.id} style={{
                      padding: 16, background: `${z.color}08`,
                      border: `1px solid ${z.color}33`, borderRadius: 6
                    }}>
                      <div className="flex-row" style={{ alignItems: 'center', marginBottom: 12 }}>
                        <div style={{
                          width: 10, height: 36, background: z.color, borderRadius: 3,
                          boxShadow: `0 0 10px ${z.color}55`
                        }} />
                        <div style={{ marginLeft: 12 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: z.color }}>{z.name}</div>
                          <div style={{ fontSize: 11, color: '#88a0c0' }}>代码: {z.code} · {z.chargerCount}个充电桩</div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <span className="badge badge-green">开放中</span>
                        </div>
                      </div>
                      <div className="flex-row" style={{ gap: 8 }}>
                        <button className="btn btn-sm btn-secondary" style={{ flex: 1 }}>编辑配置</button>
                        <button className="btn btn-sm btn-warning" style={{ flex: 1 }}>临时关闭</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e6f0', marginBottom: 10 }}>🚪 园区入口</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>入口名称</th>
                      <th>代码</th>
                      <th>车道数</th>
                      <th>今日流量</th>
                      <th>开放状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 500 }}>{e.name}</td>
                        <td style={{ fontFamily: 'Consolas', color: '#00d4ff' }}>{e.code}</td>
                        <td>{3} 条车道</td>
                        <td style={{ fontFamily: 'Consolas', color: '#00ff88' }}>{e.throughputToday}</td>
                        <td>
                          <span className={`badge ${e.status === 'open' ? 'badge-green' : e.status === 'partial' ? 'badge-yellow' : 'badge-red'}`}>
                            {e.status === 'open' ? '全开' : e.status === 'partial' ? '半开' : '关闭'}
                          </span>
                        </td>
                        <td>
                          <div className="flex-row" style={{ gap: 4 }}>
                            <button className="btn btn-sm btn-primary">配置</button>
                            <button className="btn btn-sm btn-secondary">车道</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'operator' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'auto' }}>
              <div>
                <div className="flex-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>👥 人员与权限管理</div>
                    <div style={{ fontSize: 12, color: '#88a0c0' }}>
                      管理调度员账号、角色权限、操作范围及登录策略
                    </div>
                  </div>
                  <button className="btn btn-primary">+ 新增账号</button>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>账号</th>
                    <th>角色</th>
                    <th>权限范围</th>
                    <th>班次</th>
                    <th>状态</th>
                    <th>今日操作</th>
                    <th>管理</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => {
                    const roles: Record<string, { name: string; perms: string }> = {
                      admin: { name: '管理员', perms: '全部权限' },
                      supervisor: { name: '调度主管', perms: '调度+人员' },
                      dispatcher: { name: '调度员', perms: '仅调度操作' },
                      viewer: { name: '观察员', perms: '只读查看' }
                    }
                    const ri = roles[op.role]
                    return (
                      <tr key={op.id}>
                        <td>
                          <div className="flex-row" style={{ alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0088cc, #00d4ff)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: 12
                            }}>{op.name.charAt(0)}</div>
                            <span style={{ fontWeight: 500 }}>{op.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'Consolas', color: '#88a0c0' }}>{op.account}</td>
                        <td>
                          <span className={`badge ${op.role === 'admin' ? 'badge-red' : op.role === 'supervisor' ? 'badge-yellow' : op.role === 'dispatcher' ? 'badge-blue' : 'badge-gray'}`}>
                            {ri.name}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#88a0c0' }}>{ri.perms}</td>
                        <td>{op.shift}</td>
                        <td>
                          <span className={`status-dot ${op.status === 'online' ? 'status-green' : op.status === 'busy' ? 'status-yellow' : 'status-gray'}`} />
                          <span style={{ marginLeft: 4, fontSize: 12 }}>
                            {op.status === 'online' ? '在线' : op.status === 'busy' ? '忙碌' : '离线'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'Consolas' }}>
                          <span style={{ color: '#00d4ff' }}>{op.operationCount}</span> /
                          <span style={{ color: '#00ff88', marginLeft: 4 }}>{op.resolvedEvents}</span>
                        </td>
                        <td>
                          <div className="flex-row" style={{ gap: 4 }}>
                            <button className="btn btn-sm btn-primary">编辑</button>
                            <button className="btn btn-sm btn-secondary">权限</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div style={{
                padding: 16, background: 'rgba(255, 170, 0, 0.05)',
                border: '1px solid rgba(255, 170, 0, 0.15)', borderRadius: 6
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffaa00', marginBottom: 10 }}>🔐 角色权限说明</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
                  {[
                    { r: '管理员', c: '所有功能，含用户、系统配置', i: '🔴' },
                    { r: '调度主管', c: '全部调度 + 人员管理 + 报表', i: '🟡' },
                    { r: '调度员', c: '叫号、调度、事件处理、广播', i: '🔵' },
                    { r: '观察员', c: '只读查看，不可操作任何功能', i: '⚪' }
                  ].map((it, idx) => (
                    <div key={idx} style={{
                      padding: 12, background: 'rgba(0, 20, 40, 0.4)',
                      borderRadius: 4, border: '1px solid rgba(140, 160, 200, 0.1)'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{it.i} {it.r}</div>
                      <div style={{ color: '#88a0c0', lineHeight: 1.6 }}>{it.c}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'auto' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>🔧 系统参数设置</div>
                <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 16 }}>
                  配置通知、提醒、夜间模式等系统行为
                </div>
              </div>

              <div style={{
                padding: 18, background: 'rgba(0, 136, 204, 0.06)',
                border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 6
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e6f0', marginBottom: 14 }}>🔔 通知与提醒</div>
                <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {[
                    { k: soundEnabled, s: setSoundEnabled, l: '事件声音提示', d: '有新事件时播放提示音' },
                    { k: voiceEnabled, s: setVoiceEnabled, l: '语音播报提醒', d: '叫号时自动播放语音' },
                    { k: screenEnabled, s: setScreenEnabled, l: '屏幕弹窗提醒', d: '紧急事件全屏弹窗' },
                    { k: flashEnabled, s: setFlashEnabled, l: '窗口闪烁提醒', d: '失焦时闪烁任务栏' }
                  ].map((it, idx) => (
                    <label key={idx} style={{
                      padding: 14, background: 'rgba(0, 20, 40, 0.5)',
                      border: '1px solid rgba(140, 160, 200, 0.1)', borderRadius: 4,
                      cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12
                    }}>
                      <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2 }}
                        checked={it.k} onChange={e => it.s(e.target.checked)} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#e0e6f0' }}>{it.l}</div>
                        <div style={{ fontSize: 11, color: '#88a0c0', marginTop: 2 }}>{it.d}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{
                padding: 18, background: 'rgba(102, 68, 170, 0.06)',
                border: '1px solid rgba(102, 68, 170, 0.2)', borderRadius: 6
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#aa88ff', marginBottom: 14 }}>🌙 夜间模式配置</div>
                <div className="flex-row" style={{ gap: 16, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>开始时间</label>
                    <input type="time" className="input" value={nightModeStart} onChange={e => setNightModeStart(e.target.value)} />
                  </div>
                  <div style={{ fontSize: 24, color: '#6680a0' }}>—</div>
                  <div>
                    <label style={{ fontSize: 12, color: '#88a0c0', display: 'block', marginBottom: 6 }}>结束时间</label>
                    <input type="time" className="input" value={nightModeEnd} onChange={e => setNightModeEnd(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, padding: 12, background: 'rgba(0, 20, 40, 0.4)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: '#88a0c0', marginBottom: 4 }}>夜间模式将自动：</div>
                    <div style={{ fontSize: 12, color: '#c0d0e0' }}>
                      • 切换为夜班策略 · 降低屏幕亮度 · 限制语音音量 · 启动巡检提醒
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-row" style={{ gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary">恢复默认</button>
                <button className="btn btn-primary" onClick={() => alert('配置已保存！')}>💾 保存配置</button>
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="flex-col" style={{ gap: 16, overflow: 'hidden' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>📋 操作审计日志</div>
                <div style={{ fontSize: 12, color: '#88a0c0' }}>
                  所有调度员的操作均被记录，用于追溯和审计（共 {operationLogs.length} 条记录）
                </div>
              </div>

              <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <table className="table">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ width: 160 }}>时间</th>
                        <th>操作人</th>
                        <th>动作类型</th>
                        <th>对象类型</th>
                        <th>目标</th>
                        <th>变更内容</th>
                        <th>IP地址</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logFiltered.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'Consolas', fontSize: 11, color: '#88a0c0' }}>
                            {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                          </td>
                          <td style={{ fontWeight: 500 }}>{log.operatorName}</td>
                          <td>
                            <span className="badge badge-blue">{log.action}</span>
                          </td>
                          <td style={{ fontSize: 12, color: '#a0b0c8' }}>
                            {log.targetType === 'vehicle' ? '🚗 车辆' :
                              log.targetType === 'alert' ? '⚠️ 事件' :
                                log.targetType === 'strategy' ? '🎯 策略' :
                                  log.targetType === 'broadcast' ? '📢 广播' : log.targetType}
                          </td>
                          <td style={{ fontFamily: 'Consolas', fontSize: 12, color: '#00d4ff' }}>
                            {log.targetName || log.targetId}
                          </td>
                          <td style={{ fontSize: 11, color: '#88a0c0' }}>
                            {log.oldValue && log.newValue ? (
                              <span>
                                <span style={{ color: '#ff6644' }}>{log.oldValue}</span>
                                <span style={{ margin: '0 4px' }}>→</span>
                                <span style={{ color: '#00ff88' }}>{log.newValue}</span>
                              </span>
                            ) : log.remark || '-'}
                          </td>
                          <td style={{ fontFamily: 'Consolas', fontSize: 11, color: '#6680a0' }}>{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
