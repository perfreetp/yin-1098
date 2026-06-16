import { create } from 'zustand'
import {
  Vehicle, Charger, Zone, Entry, AlertEvent, BroadcastMessage, Strategy,
  Operator, OperationLog, ShiftStatistics, DailyReport, RoadSegment,
  VehicleStatus, ChargerStatus, QueueType, StrategyType, EventType, AlertLevel
} from '../types'

interface DispatchState {
  currentOperator: Operator
  operators: Operator[]
  vehicles: Vehicle[]
  chargers: Charger[]
  zones: Zone[]
  entries: Entry[]
  roads: RoadSegment[]
  alerts: AlertEvent[]
  broadcasts: BroadcastMessage[]
  strategies: Strategy[]
  currentStrategy: StrategyType
  operationLogs: OperationLog[]
  shiftStats: ShiftStatistics | null
  dailyReports: DailyReport[]
  currentTime: Date
  simulationInterval: NodeJS.Timeout | null

  initSimulation: () => void
  stopSimulation: () => void
  tick: () => void

  setStrategy: (type: StrategyType) => void
  callNextVehicle: (queueId: string) => Vehicle | null
  forceDispatch: (vehicleId: string, targetChargerId: string) => boolean
  transferVehicle: (vehicleId: string, fromQueueId: string, toQueueId: string) => boolean

  acknowledgeAlert: (alertId: string, operatorId: string) => void
  resolveAlert: (alertId: string, operatorId: string, resolution: string) => void
  createAlert: (alert: Partial<AlertEvent>) => AlertEvent

  createBroadcast: (broadcast: Partial<BroadcastMessage>) => BroadcastMessage
  cancelBroadcast: (broadcastId: string) => void
  executeBroadcast: (broadcastId: string) => void

  addOperationLog: (log: Partial<OperationLog>) => void

  getVehicleById: (id: string) => Vehicle | undefined
  getChargerById: (id: string) => Charger | undefined
  getQueueById: (id: string) => any

  updateVehiclePosition: (id: string, x: number, y: number) => void
  updateChargerStatus: (id: string, status: ChargerStatus, vehicleId?: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 10)

const plateNumbers = [
  '京A88888', '京B12345', '沪C67890', '粤D24680', '川E13579',
  '浙F98765', '苏G54321', '鲁H11223', '冀J33445', '豫K55667',
  '鄂L77889', '湘M99001', '皖N22334', '赣P44556', '闽Q66778'
]

const driverNames = [
  '张建国', '李卫东', '王志强', '刘大勇', '陈建华',
  '杨光远', '黄海涛', '周明辉', '吴鹏辉', '郑洪波'
]

const mockZones: Zone[] = [
  { id: 'zone_a', name: 'A区-快充中心', code: 'A', chargerCount: 12, availableCount: 5, chargingCount: 6, faultCount: 1, queues: [], mapX: 520, mapY: 80, mapWidth: 380, mapHeight: 220, color: '#00d4ff' },
  { id: 'zone_b', name: 'B区-超充站', code: 'B', chargerCount: 8, availableCount: 3, chargingCount: 4, faultCount: 1, queues: [], mapX: 520, mapY: 340, mapWidth: 380, mapHeight: 180, color: '#00ff88' },
  { id: 'zone_c', name: 'C区-慢充区', code: 'C', chargerCount: 20, availableCount: 10, chargingCount: 9, faultCount: 1, queues: [], mapX: 520, mapY: 560, mapWidth: 380, mapHeight: 200, color: '#ffaa00' },
  { id: 'zone_d', name: 'D区-专用充电桩', code: 'D', chargerCount: 6, availableCount: 2, chargingCount: 3, faultCount: 1, queues: [], mapX: 50, mapY: 340, mapWidth: 380, mapHeight: 180, color: '#ff6688' }
]

const mockEntries: Entry[] = [
  { id: 'entry_1', name: '东门入口', code: 'E1', status: 'open', throughputToday: 328, alertLevel: 'info', lanes: [] },
  { id: 'entry_2', name: '南门入口', code: 'E2', status: 'open', throughputToday: 256, alertLevel: 'warning', lanes: [] },
  { id: 'entry_3', name: '北门入口', code: 'E3', status: 'partial', throughputToday: 189, alertLevel: 'info', lanes: [] }
]

const createInitialRoads = (): RoadSegment[] => [
  { id: 'road_1', name: '主干道1', startX: 100, startY: 50, endX: 900, endY: 50, direction: 'both', congestionLevel: 1, vehicleCount: 3, speedLimit: 20 },
  { id: 'road_2', name: '主干道2', startX: 100, startY: 300, endX: 900, endY: 300, direction: 'both', congestionLevel: 2, vehicleCount: 6, speedLimit: 20 },
  { id: 'road_3', name: '主干道3', startX: 100, startY: 540, endX: 900, endY: 540, direction: 'both', congestionLevel: 1, vehicleCount: 4, speedLimit: 20 },
  { id: 'road_4', name: '主干道4', startX: 100, startY: 780, endX: 900, endY: 780, direction: 'both', congestionLevel: 0, vehicleCount: 2, speedLimit: 20 },
  { id: 'road_v1', name: '纵向道1', startX: 50, startY: 50, endX: 50, endY: 780, direction: 'one_way', congestionLevel: 3, vehicleCount: 8, speedLimit: 15 },
  { id: 'road_v2', name: '纵向道2', startX: 500, startY: 50, endX: 500, endY: 780, direction: 'one_way', congestionLevel: 2, vehicleCount: 5, speedLimit: 15 },
  { id: 'road_v3', name: '纵向道3', startX: 950, startY: 50, endX: 950, endY: 780, direction: 'one_way', congestionLevel: 1, vehicleCount: 2, speedLimit: 15 }
]

const createMockStrategies = (): Strategy[] => [
  {
    type: 'normal', name: '常规模式', description: '日常运营标准模式，均衡各区域流量',
    queuePriorities: { entry: 1, power_30kw: 2, power_60kw: 2, power_120kw: 3, power_180kw: 3, power_240kw: 4 },
    maxQueueLength: { entry: 15, power_30kw: 20, power_60kw: 15, power_120kw: 12, power_180kw: 10, power_240kw: 8 },
    enableAutoDispatch: true, enableVoiceBroadcast: true, enableScreenDisplay: true,
    specialRules: ['优先保障120kW以上快充桩利用率'],
    icon: '⚙️', color: '#00d4ff'
  },
  {
    type: 'peak', name: '高峰模式', description: '午间/傍晚高峰时段，加快周转率，优先快充',
    queuePriorities: { entry: 2, power_30kw: 1, power_60kw: 2, power_120kw: 5, power_180kw: 5, power_240kw: 6 },
    maxQueueLength: { entry: 25, power_30kw: 10, power_60kw: 12, power_120kw: 20, power_180kw: 18, power_240kw: 15 },
    enableAutoDispatch: true, enableVoiceBroadcast: true, enableScreenDisplay: true,
    specialRules: ['限制慢充最长占用4小时', '预约车辆优先', '满电车辆30分钟提醒挪车'],
    icon: '🔥', color: '#ff6644'
  },
  {
    type: 'night', name: '夜班模式', description: '夜间低谷，关闭部分区域，集中调度',
    queuePriorities: { entry: 1, power_30kw: 3, power_60kw: 3, power_120kw: 2, power_180kw: 2, power_240kw: 1 },
    maxQueueLength: { entry: 10, power_30kw: 15, power_60kw: 15, power_120kw: 8, power_180kw: 8, power_240kw: 6 },
    enableAutoDispatch: false, enableVoiceBroadcast: false, enableScreenDisplay: true,
    specialRules: ['B区关闭，车辆引导至A/C区', '仅开放东入口', '每小时巡检一次'],
    icon: '🌙', color: '#6644aa'
  },
  {
    type: 'rain_snow', name: '雨雪模式', description: '恶劣天气，减速慢行，延长等待容忍',
    queuePriorities: { entry: 1, power_30kw: 2, power_60kw: 2, power_120kw: 3, power_180kw: 3, power_240kw: 3 },
    maxQueueLength: { entry: 30, power_30kw: 25, power_60kw: 20, power_120kw: 15, power_180kw: 15, power_240kw: 12 },
    enableAutoDispatch: true, enableVoiceBroadcast: true, enableScreenDisplay: true,
    specialRules: ['全路段限速10km/h', '增加防滑提示广播', '优先安排大型车辆至室内区域'],
    icon: '🌨️', color: '#88ccff'
  },
  {
    type: 'emergency', name: '应急模式', description: '突发事件，人工接管所有调度',
    queuePriorities: { entry: 1, power_30kw: 1, power_60kw: 1, power_120kw: 1, power_180kw: 1, power_240kw: 1 },
    maxQueueLength: { entry: 50, power_30kw: 50, power_60kw: 50, power_120kw: 50, power_180kw: 50, power_240kw: 50 },
    enableAutoDispatch: false, enableVoiceBroadcast: true, enableScreenDisplay: true,
    specialRules: ['暂停自动叫号，全部人工调度', '开放所有备用车道', '允许跨区调度不受限制'],
    icon: '🚨', color: '#ff0000'
  }
]

const createInitialChargers = (): Charger[] => {
  const chargers: Charger[] = []
  const configs = [
    { zone: 'zone_a', count: 12, power: 180, startX: 550, startY: 110, cols: 4, rows: 3 },
    { zone: 'zone_b', count: 8, power: 240, startX: 550, startY: 370, cols: 4, rows: 2 },
    { zone: 'zone_c', count: 20, power: 60, startX: 550, startY: 590, cols: 5, rows: 4 },
    { zone: 'zone_d', count: 6, power: 120, startX: 80, startY: 370, cols: 3, rows: 2 }
  ]

  configs.forEach(cfg => {
    for (let i = 0; i < cfg.count; i++) {
      const col = i % cfg.cols
      const row = Math.floor(i / cfg.cols)
      const id = `${cfg.zone}_c${i + 1}`
      const statuses: ChargerStatus[] = ['available', 'charging', 'charging', 'available', 'charging', 'available']
      const status = i === cfg.count - 1 && Math.random() > 0.7 ? 'fault' : statuses[i % statuses.length]
      chargers.push({
        id,
        code: `${cfg.zone.split('_')[1].toUpperCase()}${String(i + 1).padStart(2, '0')}`,
        name: `${cfg.power}kW充电桩`,
        power: cfg.power,
        status,
        zoneId: cfg.zone,
        currentVehicle: status === 'charging' || status === 'occupied' ? generateId() : null,
        chargingProgress: status === 'charging' ? Math.floor(Math.random() * 80) + 10 : 0,
        powerOutput: status === 'charging' ? cfg.power * (0.6 + Math.random() * 0.4) : 0,
        temperature: 28 + Math.floor(Math.random() * 15),
        errorCode: status === 'fault' ? 'E' + Math.floor(Math.random() * 500 + 100) : null,
        mapX: cfg.startX + col * 85,
        mapY: cfg.startY + row * 55,
        totalChargedToday: Math.floor(Math.random() * 800 + 100),
        utilizationRate: Math.floor(Math.random() * 40 + 40)
      })
    }
  })
  return chargers
}

const createInitialVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = []
  const statuses: VehicleStatus[] = ['queuing', 'queuing', 'moving', 'charging', 'charging', 'completed', 'exiting']
  const zones = ['zone_a', 'zone_b', 'zone_c', 'zone_d']
  const queueTypes: QueueType[] = ['power_30kw', 'power_60kw', 'power_120kw', 'power_180kw', 'power_240kw']

  for (let i = 0; i < 42; i++) {
    const status = statuses[i % statuses.length]
    const zoneId = zones[i % zones.length]
    const queueType = queueTypes[i % queueTypes.length]
    const now = new Date()
    const entryMinutesAgo = Math.floor(Math.random() * 90 + 5)
    const isCharging = status === 'charging' || status === 'completed'

    let mapX = 60 + Math.floor(Math.random() * 880)
    let mapY = 60 + Math.floor(Math.random() * 700)

    if (isCharging) {
      mapX = 550 + (i % 5) * 80
      mapY = zoneId === 'zone_a' ? 120 + Math.floor(i / 5) * 50 :
             zoneId === 'zone_b' ? 380 + Math.floor(i / 5) * 50 :
             zoneId === 'zone_c' ? 600 + Math.floor(i / 5) * 45 : 390
    }

    vehicles.push({
      id: 'v_' + generateId(),
      plateNumber: plateNumbers[i % plateNumbers.length] + (i > 14 ? String(i).slice(-2) : ''),
      vehicleType: i % 4 === 0 ? 'bus' : i % 3 === 0 ? 'van' : i % 5 === 0 ? 'small' : 'truck',
      driverName: driverNames[i % driverNames.length],
      driverPhone: '138****' + String(1000 + i * 137).slice(-4),
      currentQueue: `q_${queueType}`,
      queuePosition: status === 'queuing' ? (i % 8) + 1 : 0,
      status,
      entryTime: new Date(now.getTime() - entryMinutesAgo * 60000),
      assignedCharger: isCharging ? `${zoneId}_c${(i % 8) + 1}` : null,
      batteryLevel: isCharging ? Math.floor(Math.random() * 50 + 50) : Math.floor(Math.random() * 40 + 10),
      requiredPower: [30, 60, 120, 180, 240][i % 5],
      expectedChargeTime: Math.floor(Math.random() * 60 + 30),
      chargingStartTime: isCharging ? new Date(now.getTime() - Math.floor(Math.random() * 45 + 5) * 60000) : null,
      zoneId,
      laneId: `lane_${(i % 3) + 1}`,
      mapX,
      mapY,
      priority: i % 5 === 0 ? 2 : i % 7 === 0 ? 3 : 1,
      remark: i % 9 === 0 ? 'VIP预约车辆' : ''
    })
  }
  return vehicles
}

const createInitialAlerts = (): AlertEvent[] => {
  const now = new Date()
  return [
    {
      id: 'a_' + generateId(),
      type: 'congestion',
      level: 'warning',
      title: '纵向道1车辆拥堵',
      description: 'D区入口方向排队超过8辆，建议分流至纵向道2',
      location: '纵向道1 / D区入口',
      vehicleId: null,
      chargerId: null,
      zoneId: 'zone_d',
      createdAt: new Date(now.getTime() - 8 * 60000),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: []
    },
    {
      id: 'a_' + generateId(),
      type: 'occupying',
      level: 'warning',
      title: '车辆超时占用充电桩',
      description: 'C区C-15号充电桩车辆已充满45分钟未离开',
      location: 'C区 C-15桩',
      vehicleId: null,
      chargerId: 'zone_c_c15',
      zoneId: 'zone_c',
      createdAt: new Date(now.getTime() - 25 * 60000),
      acknowledged: true,
      acknowledgedBy: 'op_1',
      acknowledgedAt: new Date(now.getTime() - 20 * 60000),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: []
    },
    {
      id: 'a_' + generateId(),
      type: 'reverse',
      level: 'danger',
      title: '检测到逆行车辆',
      description: 'A区出口方向检测到疑似逆行车辆，请现场确认',
      location: '主干道1 / A区出口',
      vehicleId: null,
      chargerId: null,
      zoneId: 'zone_a',
      createdAt: new Date(now.getTime() - 3 * 60000),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: []
    },
    {
      id: 'a_' + generateId(),
      type: 'charger_fault',
      level: 'danger',
      title: '充电桩故障',
      description: 'B区B-08号充电桩通讯中断，错误代码E422',
      location: 'B区 B-08桩',
      vehicleId: null,
      chargerId: 'zone_b_c8',
      zoneId: 'zone_b',
      createdAt: new Date(now.getTime() - 45 * 60000),
      acknowledged: true,
      acknowledgedBy: 'op_2',
      acknowledgedAt: new Date(now.getTime() - 40 * 60000),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: []
    },
    {
      id: 'a_' + generateId(),
      type: 'vehicle_fault',
      level: 'critical',
      title: '车辆故障求助',
      description: '京B12345在充电过程中报高压系统故障，需紧急处理',
      location: 'A区 A-06桩',
      vehicleId: null,
      chargerId: 'zone_a_c6',
      zoneId: 'zone_a',
      createdAt: new Date(now.getTime() - 12 * 60000),
      acknowledged: true,
      acknowledgedBy: 'op_1',
      acknowledgedAt: new Date(now.getTime() - 10 * 60000),
      resolved: true,
      resolvedAt: new Date(now.getTime() - 2 * 60000),
      resolvedBy: 'op_1',
      resolution: '已通知维修团队，车辆已移至维修区',
      attachments: []
    },
    {
      id: 'a_' + generateId(),
      type: 'driver_missing',
      level: 'info',
      title: '司机联系不上',
      description: '粤D24680充电完成20分钟，司机电话无人接听',
      location: 'A区 A-03桩',
      vehicleId: null,
      chargerId: 'zone_a_c3',
      zoneId: 'zone_a',
      createdAt: new Date(now.getTime() - 22 * 60000),
      acknowledged: true,
      acknowledgedBy: 'op_1',
      acknowledgedAt: new Date(now.getTime() - 18 * 60000),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: []
    }
  ]
}

const createInitialOperators = (): Operator[] => {
  const now = new Date()
  return [
    { id: 'op_1', name: '李明', account: 'liming', role: 'dispatcher', status: 'online', shift: '白班', loginTime: new Date(now.getTime() - 4 * 3600000), operationCount: 156, resolvedEvents: 12 },
    { id: 'op_2', name: '王芳', account: 'wangfang', role: 'dispatcher', status: 'online', shift: '白班', loginTime: new Date(now.getTime() - 5 * 3600000), operationCount: 189, resolvedEvents: 18 },
    { id: 'op_3', name: '张磊', account: 'zhanglei', role: 'supervisor', status: 'online', shift: '白班', loginTime: new Date(now.getTime() - 3 * 3600000), operationCount: 67, resolvedEvents: 5 },
    { id: 'op_4', name: '陈静', account: 'chenjing', role: 'admin', status: 'offline', shift: '夜班', loginTime: new Date(now.getTime() - 16 * 3600000), operationCount: 45, resolvedEvents: 8 }
  ]
}

const createInitialBroadcasts = (): BroadcastMessage[] => {
  const now = new Date()
  return [
    { id: 'b_' + generateId(), type: 'both', title: '温馨提示', content: '尊敬的司机朋友，当前车辆较多，请耐心等待叫号。充电完成后请及时挪车，谢谢配合！', targetZones: ['all'], targetEntries: ['all'], scheduledTime: null, repeatCount: 5, repeatInterval: 10, createdAt: new Date(now.getTime() - 30 * 60000), createdBy: 'op_1', status: 'broadcasting', deliveryStatus: [] },
    { id: 'b_' + generateId(), type: 'voice', title: '挪车通知', content: '车牌号京A88888的车主请注意，您的车辆充电已完成，请尽快挪车，谢谢配合。', targetZones: ['zone_c'], targetEntries: [], scheduledTime: null, repeatCount: 3, repeatInterval: 2, createdAt: new Date(now.getTime() - 5 * 60000), createdBy: 'op_2', status: 'broadcasting', deliveryStatus: [] },
    { id: 'b_' + generateId(), type: 'screen', title: '屏幕滚动通知', content: '【路况提醒】纵向道1拥堵，建议从纵向道2进入D区', targetZones: ['all'], targetEntries: ['entry_1', 'entry_2'], scheduledTime: null, repeatCount: 0, repeatInterval: 0, createdAt: new Date(now.getTime() - 15 * 60000), createdBy: 'op_1', status: 'completed', deliveryStatus: [] }
  ]
}

const createMockShiftStats = (): ShiftStatistics => {
  const now = new Date()
  return {
    shiftId: 's_' + generateId(),
    shiftName: '白班 08:00-20:00',
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0),
    totalVehicles: 1286,
    totalCharged: 1156,
    totalKWh: 48520,
    averageWaitTime: 18.5,
    averageChargeTime: 52.3,
    averageTurnover: 89.7,
    peakHour: '11:00-12:00',
    peakVolume: 186,
    zoneStats: [
      { zoneId: 'zone_a', zoneName: 'A区-快充中心', vehicles: 485, kwh: 21500, avgUtilization: 78 },
      { zoneId: 'zone_b', zoneName: 'B区-超充站', vehicles: 256, kwh: 14200, avgUtilization: 72 },
      { zoneId: 'zone_c', zoneName: 'C区-慢充区', vehicles: 412, kwh: 9800, avgUtilization: 65 },
      { zoneId: 'zone_d', zoneName: 'D区-专用', vehicles: 133, kwh: 3020, avgUtilization: 58 }
    ],
    chargerStats: [],
    eventsByType: { congestion: 12, reverse: 2, occupying: 8, vehicle_fault: 3, charger_fault: 2, driver_missing: 5, emergency: 1 },
    topAlerts: ['C区充电桩占用率高建议引导至D区', 'B-08号桩持续异常建议检修', '东入口高峰时段拥堵']
  }
}

const createInitialQueues = (zones: Zone[]) => {
  const queueTypes: { type: QueueType; name: string }[] = [
    { type: 'power_30kw', name: '30kW慢充队列' },
    { type: 'power_60kw', name: '60kW队列' },
    { type: 'power_120kw', name: '120kW快充队列' },
    { type: 'power_180kw', name: '180kW超充队列' },
    { type: 'power_240kw', name: '240kW特快队列' }
  ]

  zones.forEach(zone => {
    zone.queues = queueTypes.map((qt, idx) => ({
      id: `q_${zone.id}_${qt.type}`,
      name: `${zone.code}区-${qt.name}`,
      type: qt.type,
      zoneId: zone.id,
      entryId: idx % 2 === 0 ? 'entry_1' : 'entry_2',
      laneId: `lane_${(idx % 3) + 1}`,
      maxLength: 15,
      currentLength: Math.floor(Math.random() * 10 + 2),
      vehicles: [],
      averageWaitTime: Math.floor(Math.random() * 30 + 10),
      status: (['normal', 'normal', 'crowded'] as any)[idx % 3]
    }))
  })
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  currentOperator: createInitialOperators()[0],
  operators: createInitialOperators(),
  vehicles: [],
  chargers: [],
  zones: [],
  entries: [],
  roads: [],
  alerts: [],
  broadcasts: [],
  strategies: [],
  currentStrategy: 'normal',
  operationLogs: [],
  shiftStats: null,
  dailyReports: [],
  currentTime: new Date(),
  simulationInterval: null,

  initSimulation: () => {
    const zones = mockZones.map(z => ({ ...z }))
    createInitialQueues(zones)

    set({
      vehicles: createInitialVehicles(),
      chargers: createInitialChargers(),
      zones,
      entries: mockEntries.map(e => ({ ...e })),
      roads: createInitialRoads(),
      alerts: createInitialAlerts(),
      broadcasts: createInitialBroadcasts(),
      strategies: createMockStrategies(),
      shiftStats: createMockShiftStats(),
      currentTime: new Date()
    })

    const interval = setInterval(() => {
      get().tick()
    }, 3000)

    set({ simulationInterval: interval })
  },

  stopSimulation: () => {
    const { simulationInterval } = get()
    if (simulationInterval) {
      clearInterval(simulationInterval)
      set({ simulationInterval: null })
    }
  },

  tick: () => {
    const state = get()
    const now = new Date()

    const updatedVehicles = state.vehicles.map(v => {
      let newX = v.mapX + (Math.random() - 0.5) * 15
      let newY = v.mapY + (Math.random() - 0.5) * 10
      newX = Math.max(30, Math.min(970, newX))
      newY = Math.max(30, Math.min(760, newY))

      let newBattery = v.batteryLevel
      let newProgress = 0
      let newStatus: VehicleStatus = v.status

      if (v.status === 'charging') {
        newBattery = Math.min(100, v.batteryLevel + Math.random() * 1.5)
        if (newBattery >= 95) {
          newStatus = 'completed'
        }
      }

      return {
        ...v,
        mapX: newX,
        mapY: newY,
        batteryLevel: newBattery,
        status: newStatus
      }
    })

    const updatedChargers = state.chargers.map(c => {
      if (c.status === 'charging') {
        const newProgress = Math.min(100, c.chargingProgress + Math.random() * 2)
        return {
          ...c,
          chargingProgress: newProgress,
          powerOutput: c.power * (0.5 + Math.random() * 0.5),
          temperature: 28 + Math.floor(Math.random() * 18)
        }
      }
      return c
    })

    const updatedRoads = state.roads.map(r => ({
      ...r,
      congestionLevel: Math.max(0, Math.min(4, r.congestionLevel + Math.floor((Math.random() - 0.5) * 2))),
      vehicleCount: Math.max(0, r.vehicleCount + Math.floor((Math.random() - 0.5) * 2))
    }))

    set({
      vehicles: updatedVehicles,
      chargers: updatedChargers,
      roads: updatedRoads,
      currentTime: now
    })
  },

  setStrategy: (type) => {
    const state = get()
    set({ currentStrategy: type })
    state.addOperationLog({
      operatorId: state.currentOperator.id,
      operatorName: state.currentOperator.name,
      action: '切换调度策略',
      targetType: 'strategy',
      targetId: type,
      targetName: state.strategies.find(s => s.type === type)?.name || type,
      oldValue: state.currentStrategy,
      newValue: type,
      remark: '策略切换'
    })
  },

  callNextVehicle: (queueId) => {
    const state = get()
    const queuingVehicles = state.vehicles
      .filter(v => v.status === 'queuing' && v.currentQueue === queueId)
      .sort((a, b) => b.priority - a.priority || a.queuePosition - b.queuePosition)

    if (queuingVehicles.length === 0) return null

    const vehicle = queuingVehicles[0]
    const availableChargers = state.chargers.filter(
      c => c.status === 'available' && c.zoneId === vehicle.zoneId
    )

    if (availableChargers.length === 0) return null

    const targetCharger = availableChargers[0]

    const updatedVehicles = state.vehicles.map(v =>
      v.id === vehicle.id
        ? { ...v, status: 'moving' as VehicleStatus, assignedCharger: targetCharger.id, queuePosition: 0 }
        : v
    )

    const updatedChargers = state.chargers.map(c =>
      c.id === targetCharger.id
        ? { ...c, status: 'occupied' as ChargerStatus, currentVehicle: vehicle.id }
        : c
    )

    set({ vehicles: updatedVehicles, chargers: updatedChargers })
    state.addOperationLog({
      operatorId: state.currentOperator.id,
      operatorName: state.currentOperator.name,
      action: '叫号调度',
      targetType: 'vehicle',
      targetId: vehicle.id,
      targetName: vehicle.plateNumber,
      oldValue: '排队中',
      newValue: `前往${targetCharger.code}`,
      remark: `分配至充电桩${targetCharger.code}`
    })

    return vehicle
  },

  forceDispatch: (vehicleId, targetChargerId) => {
    const state = get()
    const vehicle = state.vehicles.find(v => v.id === vehicleId)
    const charger = state.chargers.find(c => c.id === targetChargerId)

    if (!vehicle || !charger || charger.status === 'fault' || charger.status === 'maintenance') return false

    const updatedVehicles = state.vehicles.map(v =>
      v.id === vehicleId
        ? { ...v, status: 'moving' as VehicleStatus, assignedCharger: targetChargerId, queuePosition: 0, zoneId: charger.zoneId }
        : v
    )

    let prevVehicleUnassign: string | null = null
    const updatedChargers = state.chargers.map(c => {
      if (c.id === targetChargerId) {
        prevVehicleUnassign = c.currentVehicle
        return { ...c, status: 'occupied' as ChargerStatus, currentVehicle: vehicleId }
      }
      return c
    })

    if (prevVehicleUnassign) {
      for (let i = 0; i < updatedVehicles.length; i++) {
        if (updatedVehicles[i].id === prevVehicleUnassign) {
          updatedVehicles[i] = { ...updatedVehicles[i], assignedCharger: null, status: 'queuing' as VehicleStatus }
        }
      }
    }

    set({ vehicles: updatedVehicles, chargers: updatedChargers })
    state.addOperationLog({
      operatorId: state.currentOperator.id,
      operatorName: state.currentOperator.name,
      action: '强制调度',
      targetType: 'vehicle',
      targetId: vehicleId,
      targetName: vehicle.plateNumber,
      oldValue: vehicle.status,
      newValue: `强制调度至${charger.code}`,
      remark: '总控强制调度操作'
    })

    return true
  },

  transferVehicle: (vehicleId, fromQueueId, toQueueId) => {
    const state = get()
    set({
      vehicles: state.vehicles.map(v =>
        v.id === vehicleId ? { ...v, currentQueue: toQueueId } : v
      )
    })
    return true
  },

  acknowledgeAlert: (alertId, operatorId) => {
    const state = get()
    const operator = state.operators.find(o => o.id === operatorId)
    set({
      alerts: state.alerts.map(a =>
        a.id === alertId
          ? { ...a, acknowledged: true, acknowledgedBy: operatorId, acknowledgedAt: new Date() }
          : a
      )
    })
    state.addOperationLog({
      operatorId,
      operatorName: operator?.name || '',
      action: '确认事件',
      targetType: 'alert',
      targetId: alertId,
      targetName: state.alerts.find(a => a.id === alertId)?.title || '',
      oldValue: '未确认',
      newValue: '已确认',
      remark: ''
    })
  },

  resolveAlert: (alertId, operatorId, resolution) => {
    const state = get()
    const operator = state.operators.find(o => o.id === operatorId)
    set({
      alerts: state.alerts.map(a =>
        a.id === alertId
          ? {
              ...a,
              resolved: true,
              resolvedAt: new Date(),
              resolvedBy: operatorId,
              resolution,
              level: a.level === 'critical' ? 'danger' : a.level
            }
          : a
      )
    })
    state.addOperationLog({
      operatorId,
      operatorName: operator?.name || '',
      action: '处理完成',
      targetType: 'alert',
      targetId: alertId,
      targetName: state.alerts.find(a => a.id === alertId)?.title || '',
      oldValue: '处理中',
      newValue: '已解决',
      remark: resolution
    })
  },

  createAlert: (alert) => {
    const state = get()
    const newAlert: AlertEvent = {
      id: 'a_' + generateId(),
      type: alert.type || 'emergency',
      level: alert.level || 'warning',
      title: alert.title || '新事件',
      description: alert.description || '',
      location: alert.location || '',
      vehicleId: alert.vehicleId || null,
      chargerId: alert.chargerId || null,
      zoneId: alert.zoneId || null,
      createdAt: new Date(),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      attachments: alert.attachments || []
    }
    set({ alerts: [newAlert, ...state.alerts] })
    return newAlert
  },

  createBroadcast: (broadcast) => {
    const state = get()
    const newBroadcast: BroadcastMessage = {
      id: 'b_' + generateId(),
      type: broadcast.type || 'both',
      title: broadcast.title || '新广播',
      content: broadcast.content || '',
      targetZones: broadcast.targetZones || ['all'],
      targetEntries: broadcast.targetEntries || [],
      scheduledTime: broadcast.scheduledTime || null,
      repeatCount: broadcast.repeatCount || 1,
      repeatInterval: broadcast.repeatInterval || 0,
      createdAt: new Date(),
      createdBy: state.currentOperator.id,
      status: 'pending',
      deliveryStatus: []
    }
    set({ broadcasts: [newBroadcast, ...state.broadcasts] })
    state.addOperationLog({
      operatorId: state.currentOperator.id,
      operatorName: state.currentOperator.name,
      action: '创建广播',
      targetType: 'broadcast',
      targetId: newBroadcast.id,
      targetName: newBroadcast.title,
      oldValue: '',
      newValue: broadcast.content || '',
      remark: `广播类型: ${broadcast.type}`
    })
    return newBroadcast
  },

  cancelBroadcast: (broadcastId) => {
    const state = get()
    set({
      broadcasts: state.broadcasts.map(b =>
        b.id === broadcastId ? { ...b, status: 'cancelled' } : b
      )
    })
  },

  executeBroadcast: (broadcastId) => {
    const state = get()
    set({
      broadcasts: state.broadcasts.map(b =>
        b.id === broadcastId
          ? {
              ...b,
              status: 'broadcasting',
              deliveryStatus: state.zones.map(z => ({ zoneId: z.id, status: 'delivered', time: new Date() }))
            }
          : b
      )
    })
  },

  addOperationLog: (log) => {
    const state = get()
    const newLog: OperationLog = {
      id: 'l_' + generateId(),
      operatorId: log.operatorId || '',
      operatorName: log.operatorName || '',
      action: log.action || '',
      targetType: log.targetType || '',
      targetId: log.targetId || '',
      targetName: log.targetName || '',
      oldValue: log.oldValue || '',
      newValue: log.newValue || '',
      remark: log.remark || '',
      timestamp: new Date(),
      ip: '127.0.0.1'
    }
    set({ operationLogs: [newLog, ...state.operationLogs].slice(0, 500) })
  },

  getVehicleById: (id) => get().vehicles.find(v => v.id === id),
  getChargerById: (id) => get().chargers.find(c => c.id === id),
  getQueueById: (id) => {
    for (const z of get().zones) {
      const q = z.queues.find(q => q.id === id)
      if (q) return q
    }
    return null
  },

  updateVehiclePosition: (id, x, y) => {
    set({
      vehicles: get().vehicles.map(v =>
        v.id === id ? { ...v, mapX: x, mapY: y } : v
      )
    })
  },

  updateChargerStatus: (id, status, vehicleId) => {
    set({
      chargers: get().chargers.map(c =>
        c.id === id ? { ...c, status, currentVehicle: vehicleId ?? c.currentVehicle } : c
      )
    })
  }
}))
