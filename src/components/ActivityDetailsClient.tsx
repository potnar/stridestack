'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Map as MapIcon, Timer, Ruler, Zap, Activity } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface GPSPoint {
  lat: number
  lng: number
}

interface Segment {
  id: number
  distanceRange: string
  pace: string
  speed: string
}

interface ActivityData {
  summary: {
    totalDistance: number
    totalTime: number
    avgPace: string
    avgSpeed: string
    path: GPSPoint[]
    date: string
  }
  segments: Segment[]
}

export function ActivityDetailsClient() {
  const router = useRouter()
  const [data, setData] = useState<ActivityData | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const savedData = localStorage.getItem('stridestack_last_activity')
    if (savedData) {
      setData(JSON.parse(savedData))
    } else {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (data && mapContainerRef.current && !mapRef.current && data.summary.path.length > 0) {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current)
      
      const latlngs = data.summary.path.map(p => [p.lat, p.lng] as L.LatLngExpression)
      const polyline = L.polyline(latlngs, { color: '#3B82F6', weight: 4 }).addTo(map)
      
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      mapRef.current = map
    }

    return () => {
        if (mapRef.current) {
            mapRef.current.remove()
            mapRef.current = null
        }
    }
  }, [data])

  if (!data) return null

  const { summary, segments } = data
  const formattedDistance = (summary.totalDistance / 1000).toFixed(2)
  const duration = (summary.totalTime > 0 && !isNaN(summary.totalTime))
    ? new Date(summary.totalTime * 1000).toISOString().substr(11, 8)
    : "00:00:00"

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={24} />
            <span className="font-medium">Powrót</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold">Szczegóły aktywności</h1>
            <p className="text-xs text-zinc-500">
              {new Date(summary.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Ruler className="text-blue-400" />} label="Dystans" value={`${formattedDistance} km`} />
          <StatCard icon={<Timer className="text-emerald-400" />} label="Czas" value={duration} />
          <StatCard icon={<Zap className="text-amber-400" />} label="Śr. Tempo" value={`${summary.avgPace} /km`} />
          <StatCard icon={<Activity className="text-purple-400" />} label="Śr. Prędkość" value={`${summary.avgSpeed} km/h`} />
        </div>

        <div className="bg-card rounded-3xl border border-white/10 overflow-hidden h-[400px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        <div className="bg-card rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">Analiza co 100 metrów</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-zinc-400 text-sm font-medium">
                <tr>
                  <th className="px-6 py-4">Odcinek</th>
                  <th className="px-6 py-4 text-right">Tempo</th>
                  <th className="px-6 py-4 text-right">Prędkość</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {segments.map((segment) => (
                  <tr key={segment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{segment.distanceRange}</td>
                    <td className="px-6 py-4 text-right text-zinc-400">{segment.pace} min/km</td>
                    <td className="px-6 py-4 text-right text-blue-400 font-bold">{segment.speed} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-card border border-white/10 p-5 rounded-3xl flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  )
}

export default ActivityDetailsClient
