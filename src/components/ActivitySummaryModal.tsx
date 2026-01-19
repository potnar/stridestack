'use client'

import { useEffect, useRef } from 'react'
import { X, Timer, Ruler, Zap, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface GPSPoint {
  lat: number
  lng: number
}

interface ActivitySummary {
  totalDistance: number
  totalTime: number
  avgPace: string
  avgSpeed: string
  path: GPSPoint[]
  date: string
}

interface ActivitySummaryModalProps {
  isOpen: boolean
  onClose: () => void
  summary: ActivitySummary
}

export function ActivitySummaryModal({ isOpen, onClose, summary }: ActivitySummaryModalProps) {
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapRef.current && summary.path.length > 0) {
      // Fix for leaflet icons in Next.js
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      })

      const latlngs = summary.path.map(p => [p.lat, p.lng] as L.LatLngExpression)
      const polyline = L.polyline(latlngs, { color: '#3B82F6', weight: 3 }).addTo(map)
      
      map.fitBounds(polyline.getBounds(), { padding: [10, 10] })

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
  }, [isOpen, summary.path])

  if (!isOpen) return null

  const formattedDistance = (summary.totalDistance / 1000).toFixed(2)
  const formattedDuration = (summary.totalTime > 0 && !isNaN(summary.totalTime)) 
    ? new Date(summary.totalTime * 1000).toISOString().substr(11, 8)
    : "00:00:00"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative h-48 bg-zinc-900">
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Aktywność gotowa!</h2>
            <p className="text-zinc-400 mt-1">{new Date(summary.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Ruler size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Dystans</p>
                <p className="text-lg font-bold text-white">{formattedDistance} km</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Timer size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Czas</p>
                <p className="text-lg font-bold text-white">{formattedDuration}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Śr. Tempo</p>
                <p className="text-lg font-bold text-white">{summary.avgPace} /km</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Śr. Prędkość</p>
                <p className="text-lg font-bold text-white">{summary.avgSpeed} km/h</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
            >
              Zamknij
            </button>
            <button 
              onClick={() => router.push('/activity/details')}
              className="flex-[2] px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              <ExternalLink size={20} />
              Zobacz szczegóły
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivitySummaryModal
