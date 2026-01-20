'use client'

export interface WeightEntry {
  id: string
  date: string
  weight: number
  createdAt: string
}

export interface ActivityEntry {
  id: string
  type: string
  distance: number
  date: string
  createdAt: string
}

const KEYS = {
  WEIGHT: 'stridestack_weight_entries',
  ACTIVITIES: 'stridestack_activity_entries'
}

// Helpers
const getStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

const saveStorage = <T>(key: string, data: T[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

export const addWeightEntryLocal = (weight: number, date?: string) => {
  const entries = getStorage<WeightEntry>(KEYS.WEIGHT)
  const targetDate = date ? new Date(date) : new Date()
  
  // Format target date to YYYY-MM-DD for comparison
  const targetDateString = targetDate.toISOString().split('T')[0]

  const existing = entries.find(e => {
    const entryDateString = new Date(e.date).toISOString().split('T')[0]
    return entryDateString === targetDateString
  })

  if (existing) {
    return { success: false, error: 'ALREADY_EXISTS' }
  }

  const newEntry: WeightEntry = {
    id: crypto.randomUUID(),
    weight,
    date: targetDate.toISOString(),
    createdAt: new Date().toISOString()
  }
  saveStorage(KEYS.WEIGHT, [...entries, newEntry])
  return { success: true }
}

export const getEarliestWeightDateLocal = () => {
  const entries = getStorage<WeightEntry>(KEYS.WEIGHT)
  if (entries.length === 0) return new Date().toISOString()
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return sorted[0].date
}

export const addActivityEntryLocal = (type: string, distance: number, date?: string) => {
  const entries = getStorage<ActivityEntry>(KEYS.ACTIVITIES)
  const newEntry: ActivityEntry = {
    id: crypto.randomUUID(),
    type,
    distance,
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
  saveStorage(KEYS.ACTIVITIES, [...entries, newEntry])
  return { success: true }
}

export const getDashboardDataLocal = () => {
  const weights = getStorage<WeightEntry>(KEYS.WEIGHT)
  const activities = getStorage<ActivityEntry>(KEYS.ACTIVITIES)

  const latestWeight = [...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  
  const totalDistance = activities.reduce((acc, curr) => acc + curr.distance, 0)
  const runDistance = activities.filter(a => a.type === 'RUN').reduce((acc, curr) => acc + curr.distance, 0)
  const bikeDistance = activities.filter(a => a.type === 'BIKE').reduce((acc, curr) => acc + curr.distance, 0)

  const heightM = 1.80
  const bmi = latestWeight ? (latestWeight.weight / (heightM * heightM)).toFixed(1) : '--'

  return {
    weight: latestWeight?.weight ?? '--',
    bmi,
    totalDistance: Math.round(totalDistance),
    runDistance: Math.round(runDistance),
    bikeDistance: Math.round(bikeDistance),
    lastUpdated: Date.now(),
  }
}

export const getWeightHistoryLocal = (startDate: Date, endDate: Date) => {
  const entries = getStorage<WeightEntry>(KEYS.WEIGHT)
  const start = startDate.getTime()
  const end = endDate.getTime()

  return entries
    .filter(e => {
      const time = new Date(e.date).getTime()
      return time >= start && time <= end
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export const deleteWeightEntryLocal = (id: string) => {
  const entries = getStorage<WeightEntry>(KEYS.WEIGHT)
  const filtered = entries.filter(e => e.id !== id)
  saveStorage(KEYS.WEIGHT, filtered)
  return { success: true }
}
