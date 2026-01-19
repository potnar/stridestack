'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Weight, CheckSquare, Upload, ChevronDown, ChevronUp, Map as MapIcon, Timer, Ruler, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addWeightEntry, addActivityEntry } from '@/app/actions'
import * as FitDecoderModule from 'fit-decoder'
import dynamic from 'next/dynamic'

const ActivitySummaryModal = dynamic(
  () => import('@/components/ActivitySummaryModal'),
  { ssr: false }
)

interface Segment {
  id: number
  distanceRange: string
  pace: string
  speed: string
}

interface GPSPoint {
  lat: number
  lng: number
}

interface ActivitySummary {
  totalDistance: number // meters
  totalTime: number // seconds
  avgPace: string
  avgSpeed: string
  path: GPSPoint[]
  date: string
}

interface AddEntryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddEntryModal({ isOpen, onClose }: AddEntryModalProps) {
  const router = useRouter()
  const [type, setType] = useState<'weight' | 'activity' | 'suunto'>('weight')
  
  // Suunto Import State
  const [segments, setSegments] = useState<Segment[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    console.log('File upload started:', file.name)
    try {
      const buffer = await file.arrayBuffer()
      console.log('Buffer size:', buffer.byteLength)
      
      const rawData = FitDecoderModule.fit2json(buffer)
      console.log('Raw data parsed:', !!rawData)
      
      const data = FitDecoderModule.parseRecords(rawData)
      console.log('Data messages:', Object.keys(data.messages || {}))
      
      const allMessages = data.records || []
      const records = allMessages.filter((m: any) => m.type === 'record').map((m: any) => m.data)
      const sessions = allMessages.filter((m: any) => m.type === 'session').map((m: any) => m.data)
      const session = sessions[0] || {}

      if (records.length === 0) {
        alert('No GPX records found in this FIT file.')
        setLoading(false)
        return
      }

      console.log('Filtered records count:', records.length)
      console.log('Sample record data:', JSON.stringify(records[0], null, 2))

      const calculatedSegments: Segment[] = []
      const path: GPSPoint[] = []
      
      let segmentStartTime: number | null = null
      let segmentStartDistance = 0
      let segmentId = 1
      
      const firstRecord = records[0]
      const lastRecord = records[records.length - 1]
      
      let totalTimeMs = 0
      if (firstRecord?.timestamp && lastRecord?.timestamp) {
        const start = new Date(firstRecord.timestamp).getTime()
        const end = new Date(lastRecord.timestamp).getTime()
        if (!isNaN(start) && !isNaN(end)) {
          totalTimeMs = end - start
        }
      }

      const totalDistance = session.total_distance || lastRecord.distance || lastRecord.total_distance || 0
      const sessionTotalTime = session.total_timer_time || session.total_elapsed_time || (totalTimeMs / 1000)

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const distance = record.distance ?? record.total_distance
        const timestamp = record.timestamp
        const { position_lat, position_long } = record

        if (distance === undefined || timestamp === undefined) continue

        if (position_lat !== undefined && position_long !== undefined) {
          // Semi-circles to degrees conversion if needed
          const lat = Math.abs(position_lat) > 180 ? position_lat * (180 / Math.pow(2, 31)) : position_lat
          const lng = Math.abs(position_long) > 180 ? position_long * (180 / Math.pow(2, 31)) : position_long
          path.push({ lat, lng })
        }

        if (segmentStartTime === null) {
          segmentStartTime = new Date(timestamp).getTime()
          segmentStartDistance = distance
        }

        const distanceInSegment = distance - segmentStartDistance

        if (distanceInSegment >= 100) {
          const currentTime = new Date(timestamp).getTime()
          const timeElapsedMs = currentTime - segmentStartTime
          
          if (timeElapsedMs > 0) {
            const timeSeconds = timeElapsedMs / 1000
            const speedMs = distanceInSegment / timeSeconds
            const speedKmh = (speedMs * 3.6).toFixed(1)
            
            const paceMinPerKm = (timeSeconds / distanceInSegment) * 1000 / 60
            const paceMinutes = Math.floor(paceMinPerKm)
            const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60)
            const formattedPace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`

            calculatedSegments.push({
              id: segmentId++,
              distanceRange: `${Math.round(segmentStartDistance)}m - ${Math.round(distance)}m`,
              pace: formattedPace,
              speed: speedKmh
            })
          }

          segmentStartTime = currentTime
          segmentStartDistance = distance
        }
      }

      const avgPaceMinPerKm = (sessionTotalTime / totalDistance) * 1000 / 60
      const avgPaceMin = Math.floor(avgPaceMinPerKm)
      const avgPaceSec = Math.round((avgPaceMinPerKm - avgPaceMin) * 60)
      
      const activitySummary: ActivitySummary = {
        totalDistance,
        totalTime: sessionTotalTime,
        avgPace: totalDistance > 0 && sessionTotalTime > 0 ? `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')}` : '0:00',
        avgSpeed: sessionTotalTime > 0 ? ((totalDistance / sessionTotalTime) * 3.6).toFixed(1) : '0.0',
        path,
        date: firstRecord?.timestamp || new Date().toISOString()
      }

      const activityData = {
        summary: activitySummary,
        segments: calculatedSegments
      }
      localStorage.setItem('stridestack_last_activity', JSON.stringify(activityData))

      setSegments(calculatedSegments)
      setSummary(activitySummary)
      setShowSummary(true)
    } catch (error: any) {
      console.error('Failed to parse FIT file:', error)
      alert(`Failed to parse FIT file: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md bg-card p-6 rounded-t-2xl sm:rounded-2xl border-t sm:border border-white/10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New Entry</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Type Switcher */}
        <div className="flex gap-1 p-1 bg-black/40 rounded-xl mb-6">
          <button
            onClick={() => setType('weight')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors",
              type === 'weight' ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Weight size={16} />
            Weight
          </button>
          <button
            onClick={() => setType('activity')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors",
              type === 'activity' ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <CheckSquare size={16} />
            Manual
          </button>
          <button
            onClick={() => setType('suunto')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors",
              type === 'suunto' ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Upload size={16} />
            Suunto
          </button>
        </div>

        {/* Forms */}
        {type === 'weight' ? (
          <form className="space-y-4" action={async (formData) => {
            const weight = parseFloat(formData.get('weight') as string)
            const date = formData.get('date') as string
            if (weight) {
              await addWeightEntry(weight, date)
              router.refresh()
            }
            onClose()
          }}>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Weight (kg)</label>
              <input
                name="weight"
                type="number"
                step="0.1"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0.0"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <button className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all">
              Save Weight
            </button>
          </form>
        ) : type === 'activity' ? (
          <form className="space-y-4" action={async (formData) => {
             const type = formData.get('type') as string
             const distance = parseFloat(formData.get('distance') as string)
             const date = formData.get('date') as string
             if (type && distance) {
               await addActivityEntry(type, distance, date)
               router.refresh()
             }
             onClose()
          }}>
            <div>
               <label className="block text-sm text-zinc-400 mb-1.5">Activity Type</label>
               <div className="grid grid-cols-2 gap-2">
                 <label className="cursor-pointer">
                   <input type="radio" name="type" value="RUN" className="peer sr-only" defaultChecked />
                   <div className="bg-black/40 border border-white/10 rounded-xl py-3 text-center peer-checked:bg-blue-600 peer-checked:text-white transition-all">
                     Run
                   </div>
                 </label>
                 <label className="cursor-pointer">
                   <input type="radio" name="type" value="BIKE" className="peer sr-only" />
                   <div className="bg-black/40 border border-white/10 rounded-xl py-3 text-center peer-checked:bg-blue-600 peer-checked:text-white transition-all">
                     Bike
                   </div>
                 </label>
               </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Distance (km)</label>
              <input
                name="distance"
                type="number"
                step="0.01"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <button className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all">
              Save Activity
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept=".fit"
                onChange={handleFileUpload}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed border-white/10 rounded-xl p-8
                flex flex-col items-center justify-center gap-3
                transition-colors ${loading ? 'bg-white/5' : 'hover:bg-white/5'}
              `}>
                <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center text-blue-500">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {loading ? 'Przetwarzanie...' : 'Kliknij lub przeciągnij plik .fit'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Eksport z aplikacji Suunto</p>
                </div>
              </div>
            </div>

            {segments.length > 0 && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowSummary(true)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <MapIcon size={20} />
                  Pokaż podsumowanie
                </button>
                <button 
                   onClick={() => setIsExpanded(!isExpanded)}
                   className="flex items-center justify-center gap-2 text-sm text-zinc-400 py-2"
                >
                   {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                   {isExpanded ? 'Ukryj odcinki' : 'Pokaż odcinki'}
                </button>
              </div>
            )}

            {isExpanded && segments.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400 font-medium sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Dystans</th>
                      <th className="px-3 py-2 text-right">Tempo</th>
                      <th className="px-3 py-2 text-right">Prędkość</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {segments.map((segment) => (
                      <tr key={segment.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 text-white font-medium">{segment.distanceRange}</td>
                        <td className="px-3 py-2 text-right text-zinc-300">{segment.pace}</td>
                        <td className="px-3 py-2 text-right text-blue-400 font-medium">{segment.speed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {summary && (
        <ActivitySummaryModal 
          isOpen={showSummary} 
          onClose={() => setShowSummary(false)} 
          summary={summary}
        />
      )}
    </div>
  )
}
