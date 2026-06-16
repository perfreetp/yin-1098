export type VehicleStatus = 'queuing' | 'moving' | 'charging' | 'completed' | 'exiting' | 'fault'
export type ChargerStatus = 'available' | 'occupied' | 'charging' | 'fault' | 'maintenance'
export type QueueType = 'entry' | 'power_30kw' | 'power_60kw' | 'power_120kw' | 'power_180kw' | 'power_240kw'
export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical'
export type EventType = 'congestion' | 'reverse' | 'occupying' | 'vehicle_fault' | 'charger_fault' | 'driver_missing' | 'emergency'
export type StrategyType = 'normal' | 'peak' | 'night' | 'rain_snow' | 'emergency'
export type ChargingSpeed = 'slow' | 'medium' | 'fast' | 'ultra'

export interface Vehicle {
  id: string
  plateNumber: string
  vehicleType: 'truck' | 'van' | 'bus' | 'small'
  driverName: string
  driverPhone: string
  currentQueue: string
  queuePosition: number
  status: VehicleStatus
  entryTime: Date
  arrivedAt: Date
  scheduledAt: Date | null
  completedAt: Date | null
  assignedCharger: string | null
  batteryLevel: number
  requiredPower: number
  expectedChargeTime: number
  chargingStartTime: Date | null
  zoneId: string
  entryId: string
  laneId: string
  mapX: number
  mapY: number
  priority: number
  remark: string
}

export interface Charger {
  id: string
  code: string
  name: string
  power: number
  status: ChargerStatus
  zoneId: string
  currentVehicle: string | null
  chargingProgress: number
  powerOutput: number
  temperature: number
  errorCode: string | null
  mapX: number
  mapY: number
  totalChargedToday: number
  utilizationRate: number
}

export interface Zone {
  id: string
  name: string
  code: string
  chargerCount: number
  availableCount: number
  chargingCount: number
  faultCount: number
  queues: Queue[]
  mapX: number
  mapY: number
  mapWidth: number
  mapHeight: number
  color: string
}

export interface Queue {
  id: string
  name: string
  type: QueueType
  zoneId: string
  entryId: string
  laneId: string
  maxLength: number
  currentLength: number
  vehicles: string[]
  averageWaitTime: number
  status: 'normal' | 'crowded' | 'full'
}

export interface Entry {
  id: string
  name: string
  code: string
  lanes: Lane[]
  status: 'open' | 'closed' | 'partial'
  throughputToday: number
  alertLevel: AlertLevel
}

export interface Lane {
  id: string
  name: string
  entryId: string
  queueType: QueueType
  currentCount: number
  maxCount: number
  avgWait: number
}

export interface AlertEvent {
  id: string
  type: EventType
  level: AlertLevel
  title: string
  description: string
  location: string
  vehicleId: string | null
  chargerId: string | null
  zoneId: string | null
  createdAt: Date
  acknowledged: boolean
  acknowledgedBy: string | null
  acknowledgedAt: Date | null
  resolved: boolean
  resolvedAt: Date | null
  resolvedBy: string | null
  resolution: string | null
  attachments: string[]
}

export interface BroadcastMessage {
  id: string
  type: 'voice' | 'screen' | 'both'
  title: string
  content: string
  targetZones: string[]
  targetEntries: string[]
  scheduledTime: Date | null
  repeatCount: number
  repeatInterval: number
  createdAt: Date
  createdBy: string
  status: 'draft' | 'pending' | 'broadcasting' | 'completed' | 'cancelled'
  deliveryStatus: { zoneId: string; status: string; time: Date }[]
}

export interface Strategy {
  type: StrategyType
  name: string
  description: string
  queuePriorities: Record<QueueType, number>
  maxQueueLength: Record<QueueType, number>
  enableAutoDispatch: boolean
  enableVoiceBroadcast: boolean
  enableScreenDisplay: boolean
  specialRules: string[]
  icon: string
  color: string
}

export interface Operator {
  id: string
  name: string
  account: string
  role: 'admin' | 'dispatcher' | 'supervisor' | 'viewer'
  status: 'online' | 'offline' | 'busy'
  shift: string
  loginTime: Date
  operationCount: number
  resolvedEvents: number
}

export interface OperationLog {
  id: string
  operatorId: string
  operatorName: string
  action: string
  targetType: string
  targetId: string
  targetName: string
  oldValue: string
  newValue: string
  remark: string
  timestamp: Date
  ip: string
}

export interface ShiftStatistics {
  shiftId: string
  shiftName: string
  startTime: Date
  endTime: Date
  totalVehicles: number
  totalCharged: number
  totalKWh: number
  averageWaitTime: number
  averageChargeTime: number
  averageTurnover: number
  peakHour: string
  peakVolume: number
  zoneStats: { zoneId: string; zoneName: string; vehicles: number; kwh: number; avgUtilization: number }[]
  chargerStats: { chargerId: string; code: string; utilization: number; kwh: number; sessions: number }[]
  eventsByType: Record<EventType, number>
  topAlerts: string[]
}

export interface DailyReport {
  date: string
  totalVehicles: number
  totalCharged: number
  totalKWh: number
  avgWaitTime: number
  avgChargeTime: number
  avgTurnover: number
  peakPeriod: string
  zoneDistribution: { zone: string; count: number; percentage: number }[]
  eventSummary: { type: string; count: number; resolved: number }[]
  operatorPerformance: { name: string; operations: number; resolved: number; avgResponse: number }[]
  comments: string
}

export interface HistoryReport {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  period: string
  generatedAt: Date
  generatedBy: string
  fileSize: string
  status: 'generated' | 'generating'
  summary: string
  pdfData?: string
}

export interface MapPosition {
  x: number
  y: number
}

export interface RoadSegment {
  id: string
  name: string
  startX: number
  startY: number
  endX: number
  endY: number
  direction: 'both' | 'one_way'
  congestionLevel: number
  vehicleCount: number
  speedLimit: number
}
