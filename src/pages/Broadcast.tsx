import { useState } from 'react'
import { useDispatchStore } from '../store/dispatchStore'
import PageHeader from '../components/PageHeader'
import { BroadcastMessage } from '../types'

function Broadcast() {
  const { broadcasts, zones, entries, currentOperator, createBroadcast, cancelBroadcast, executeBroadcast } = useDispatchStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'voice' | 'screen' | 'both'>('both')
  const [selectedZones, setSelectedZones] = useState<string[]>(['all'])
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [repeatCount, setRepeatCount] = useState(1)
  const [repeatInterval, setRepeatInterval] = useState(5)
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose')
  const [filter, setFilter] = useState<'all' | 'voice' | 'screen'>('all')

  const templates = [
    { id: 1, title: '高峰拥堵提示', content: '尊敬的各位司机朋友，当前园区进入高峰期，车辆较多，请耐心等待叫号，请勿随意插队或逆行，感谢您的配合！', type: 'both' },
    { id: 2, title: '挪车通知（通用）', content: '车牌号{车牌}的车主您好，您的车辆充电已完成，请您尽快将车辆驶离充电位，把位置留给其他需要充电的车辆，谢谢配合！', type: 'voice' },
    { id: 3, title: '雨雪天气提醒', content: '各位司机朋友请注意，当前园区出现雨雪天气，请减速慢行，注意行车安全。路面湿滑，请保持安全车距，谨慎驾驶。', type: 'both' },
    { id: 4, title: '夜班温馨提示', content: '各位夜间充电的司机朋友，夜间园区安静，请关闭车灯、不要鸣笛，保障良好休息环境。夜班服务热线：400-XXX-XXXX。', type: 'voice' },
    { id: 5, title: '临时维修通知', content: '各位司机朋友，{区域}{桩号号}将进行临时维护，预计需要30分钟，请使用其他充电桩，给您带来不便敬请谅解。', type: 'screen' },
    { id: 6, title: '火情应急演练通知', content: '各位司机朋友，园区将于{时间}进行消防应急演练，届时会有警报声响，请不要惊慌，听从现场工作人员指挥，谢谢配合！', type: 'both' },
  ]

  const handleSubmit = () => {
    if (!title || !content) {
      alert('请填写标题和内容')
      return
    }
    createBroadcast({
      title, content, type,
      targetZones: selectedZones,
      targetEntries: selectedEntries,
      repeatCount, repeatInterval
    })
    alert('广播已创建成功！')
    setTitle('')
    setContent('')
  }

  const useTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title)
    setContent(tpl.content)
    setType(tpl.type as any)
    setTab('compose')
  }

  const formatTime = (d: Date) => new Date(d).toLocaleString('zh-CN', { hour12: false })

  const filteredBroadcasts = broadcasts.filter(b =>
    filter === 'all' ? true : b.type === filter || b.type === 'both'
  )

  const toggleZone = (id: string) => {
    if (id === 'all') {
      setSelectedZones(['all'])
      return
    }
    setSelectedZones(prev => {
      const next = prev.filter(z => z !== 'all')
      if (next.includes(id)) return next.filter(z => z !== id)
      return [...next, id]
    })
  }

  const toggleEntry = (id: string) => {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  return (
    <div className="page-container">
      <PageHeader currentPage="broadcast" title="广播指挥台" />

      <div className="card" style={{ padding: 12 }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: 24 }}>
          <div className="nav-buttons">
            {[
              { k: 'compose', l: '📝 新建广播' },
              { k: 'history', l: '📋 广播记录' },
              { k: 'templates', l: '📚 模板库' }
            ].map(it => (
              <button key={it.k}
                className={`nav-btn ${tab === it.k ? 'active' : ''}`}
                onClick={() => setTab(it.k as any)}>
                {it.l}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, fontSize: 12 }}>
            <div>📢 正在播放: <b style={{ color: '#00d4ff' }}>{broadcasts.filter(b => b.status === 'broadcasting').length}</b></div>
            <div>📋 今日累计: <b style={{ color: '#00ff88' }}>{broadcasts.length}</b>条</div>
            <div>🔊 语音播报: <span className="status-dot status-green" style={{ marginLeft: 6 }} />在线</div>
            <div>📺 屏幕下发: <span className="status-dot status-green" style={{ marginLeft: 6 }} />在线</div>
          </div>
        </div>
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: tab === 'compose' ? '3fr 2fr' : '1fr', flex: 1 }}>
        {tab === 'compose' && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-title">📝 编辑广播内容</div>
              <div className="flex-col" style={{ gap: 14, padding: '4px 4px' }}>
                <div className="flex-row" style={{ gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>广播标题</label>
                    <input className="input" style={{ width: '100%' }} placeholder="请输入标题"
                      value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>广播类型</label>
                    <div className="flex-row" style={{ gap: 4 }}>
                      {[
                        { k: 'voice', l: '🔊 语音', c: '#ff6644' },
                        { k: 'screen', l: '📺 屏幕', c: '#00d4ff' },
                        { k: 'both', l: '📢 全部', c: '#00ff88' }
                      ].map(it => (
                        <button key={it.k}
                          style={{
                            padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                            background: type === it.k ? `${it.c}22` : 'rgba(100,120,160,0.1)',
                            border: `1px solid ${type === it.k ? it.c : 'rgba(140,160,200,0.2)'}`,
                            color: type === it.k ? it.c : '#88a0c0', transition: 'all 0.2s'
                          }}
                          onClick={() => setType(it.k as any)}>
                          {it.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>
                    广播内容 <span style={{ color: '#6680a0' }}>({content.length}/500字)</span>
                  </label>
                  <textarea className="textarea" style={{ width: '100%', minHeight: 160 }}
                    placeholder="请输入要播报的内容，支持使用中文语音合成播报..."
                    value={content} onChange={e => setContent(e.target.value.slice(0, 500))} />
                </div>

                <div className="flex-row" style={{ gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>推送区域</label>
                    <div className="flex-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <button
                        style={{
                          padding: '5px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                          background: selectedZones.includes('all') ? 'rgba(0, 212, 255, 0.2)' : 'rgba(100,120,160,0.1)',
                          border: `1px solid ${selectedZones.includes('all') ? '#00d4ff' : 'rgba(140,160,200,0.2)'}`,
                          color: selectedZones.includes('all') ? '#00d4ff' : '#88a0c0'
                        }}
                        onClick={() => toggleZone('all')}>
                        全园区
                      </button>
                      {zones.map(z => (
                        <button key={z.id}
                          style={{
                            padding: '5px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                            background: selectedZones.includes(z.id) ? `${z.color}22` : 'rgba(100,120,160,0.1)',
                            border: `1px solid ${selectedZones.includes(z.id) ? z.color : 'rgba(140,160,200,0.2)'}`,
                            color: selectedZones.includes(z.id) ? z.color : '#88a0c0'
                          }}
                          onClick={() => toggleZone(z.id)}>
                          {z.code}区
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>入口显示屏</label>
                    <div className="flex-row" style={{ gap: 6 }}>
                      {entries.map(e => (
                        <button key={e.id}
                          style={{
                            padding: '5px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                            background: selectedEntries.includes(e.id) ? 'rgba(0, 255, 136, 0.2)' : 'rgba(100,120,160,0.1)',
                            border: `1px solid ${selectedEntries.includes(e.id) ? '#00ff88' : 'rgba(140,160,200,0.2)'}`,
                            color: selectedEntries.includes(e.id) ? '#00ff88' : '#88a0c0'
                          }}
                          onClick={() => toggleEntry(e.id)}>
                          {e.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-row" style={{ gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>重复次数</label>
                    <select className="input" value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value))}>
                      <option value={1}>单次</option>
                      <option value={2}>2次</option>
                      <option value={3}>3次</option>
                      <option value={5}>5次</option>
                      <option value={10}>10次</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#88a0c0', marginBottom: 6 }}>间隔（分钟）</label>
                    <select className="input" value={repeatInterval} onChange={e => setRepeatInterval(Number(e.target.value))}>
                      <option value={1}>1分钟</option>
                      <option value={3}>3分钟</option>
                      <option value={5}>5分钟</option>
                      <option value={10}>10分钟</option>
                      <option value={30}>30分钟</option>
                    </select>
                  </div>
                </div>

                <div className="flex-row" style={{ gap: 10, marginTop: 8 }}>
                  <button className="btn btn-lg btn-success" style={{ flex: 1 }} onClick={handleSubmit}>
                    🚀 立即下发
                  </button>
                  <button className="btn btn-lg btn-warning" style={{ flex: 1 }}>
                    ⏰ 定时发送
                  </button>
                  <button className="btn btn-lg btn-secondary" onClick={() => { setTitle(''); setContent('') }}>
                    🗑 清空
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-title">
                📚 快捷模板
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-sm btn-secondary">+ 新建模板</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div className="flex-col" style={{ gap: 10 }}>
                  {templates.map(t => (
                    <div key={t.id} style={{
                      padding: 12, background: 'rgba(0, 136, 204, 0.06)',
                      border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 4, cursor: 'pointer'
                    }}
                      onClick={() => useTemplate(t)}
                    >
                      <div className="flex-row" style={{ alignItems: 'center', marginBottom: 6 }}>
                        <span className="badge badge-blue">{t.type === 'voice' ? '语音' : t.type === 'screen' ? '屏幕' : '全部'}</span>
                        <span style={{ fontWeight: 600, color: '#e0e6f0', fontSize: 13, marginLeft: 8 }}>{t.title}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#88a0c0', lineHeight: 1.6, maxHeight: 48, overflow: 'hidden' }}>
                        {t.content}
                      </div>
                      <div style={{ marginTop: 8, textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: '#00d4ff' }}>点击使用 →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(140, 160, 200, 0.15)' }}>
                <div style={{ fontSize: 12, color: '#88a0c0', marginBottom: 8 }}>🎙 语音预览</div>
                <div style={{
                  padding: 14, background: '#0a1420',
                  border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 4,
                  fontSize: 12, color: '#c0d0e0', lineHeight: 1.7, minHeight: 80
                }}>
                  {content || '编辑广播内容后可在此处预览语音效果...'}
                </div>
                <div className="flex-row" style={{ marginTop: 8, gap: 8 }}>
                  <button className="btn btn-sm btn-primary" style={{ flex: 1 }}>▶ 试听</button>
                  <select className="input" style={{ flex: 1 }}>
                    <option>普通话-女声</option>
                    <option>普通话-男声</option>
                    <option>粤语-女声</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">
              📋 广播历史记录
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {['all', 'voice', 'screen'].map(f => (
                  <button key={f}
                    className={`nav-btn ${filter === f ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => setFilter(f as any)}>
                    {f === 'all' ? '全部' : f === 'voice' ? '语音' : '屏幕'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>标题</th>
                    <th>类型</th>
                    <th>目标区域</th>
                    <th>重复</th>
                    <th>操作人</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBroadcasts.map((b: BroadcastMessage) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'Consolas', fontSize: 11, color: '#88a0c0' }}>{formatTime(b.createdAt)}</td>
                      <td style={{ fontWeight: 500 }}>{b.title}</td>
                      <td>
                        <span className={`badge ${b.type === 'voice' ? 'badge-yellow' : b.type === 'screen' ? 'badge-blue' : 'badge-green'}`}>
                          {b.type === 'voice' ? '语音' : b.type === 'screen' ? '屏幕' : '全部'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#88a0c0' }}>
                        {b.targetZones.includes('all') ? '全园区' :
                          b.targetZones.map(zid => zones.find(z => z.id === zid)?.code || zid).join(', ')}
                      </td>
                      <td style={{ fontSize: 12 }}>{b.repeatCount}次 / {b.repeatInterval}分</td>
                      <td style={{ fontSize: 12 }}>{b.createdBy === currentOperator.id ? currentOperator.name : b.createdBy}</td>
                      <td>
                        <span className={`badge ${b.status === 'broadcasting' ? 'badge-green' : b.status === 'completed' ? 'badge-blue' : b.status === 'cancelled' ? 'badge-gray' : 'badge-yellow'}`}>
                          {b.status === 'broadcasting' ? '播放中' : b.status === 'completed' ? '已完成' : b.status === 'cancelled' ? '已取消' : '待执行'}
                        </span>
                      </td>
                      <td>
                        <div className="flex-row" style={{ gap: 4 }}>
                          {b.status === 'pending' && (
                            <button className="btn btn-sm btn-success" onClick={() => executeBroadcast(b.id)}>播放</button>
                          )}
                          {b.status === 'broadcasting' && (
                            <button className="btn btn-sm btn-danger" onClick={() => cancelBroadcast(b.id)}>停止</button>
                          )}
                          <button className="btn btn-sm btn-secondary">详情</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-title">📚 广播模板管理</div>
            <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: 4 }}>
              {templates.map(t => (
                <div key={t.id} style={{
                  padding: 16, background: 'rgba(0, 136, 204, 0.06)',
                  border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: 6
                }}>
                  <div className="flex-row" style={{ alignItems: 'center', marginBottom: 10 }}>
                    <span className={`badge ${t.type === 'voice' ? 'badge-yellow' : t.type === 'screen' ? 'badge-blue' : 'badge-green'}`}>
                      {t.type === 'voice' ? '语音' : t.type === 'screen' ? '屏幕' : '全部'}
                    </span>
                    <span style={{ fontWeight: 600, color: '#e0e6f0', fontSize: 14, marginLeft: 8 }}>{t.title}</span>
                  </div>
                  <div style={{
                    fontSize: 12, color: '#a0b0c8', lineHeight: 1.7,
                    background: '#0a1420', padding: 12, borderRadius: 4,
                    border: '1px solid rgba(0, 212, 255, 0.08)', minHeight: 90
                  }}>
                    {t.content}
                  </div>
                  <div className="flex-row" style={{ marginTop: 12, gap: 6 }}>
                    <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => useTemplate(t)}>使用模板</button>
                    <button className="btn btn-sm btn-secondary">编辑</button>
                    <button className="btn btn-sm btn-danger" style={{ opacity: 0.7 }}>删</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Broadcast
