export interface ActionResult {
  success: boolean
  error?: string
}

export interface DashboardData {
  weight: number | string
  bmi: string
  bmiCategory: string
  userHeightM: number
  totalDistance: number
  runDistance: number
  bikeDistance: number
  lastUpdated: number
}

export interface WeightEntry {
  id: string
  date: string
  weight: number
  createdAt: string
}

export interface ActivityEntry {
  id: string
  type: 'RUN' | 'BIKE'
  distance: number
  date: string
  createdAt: string
}

