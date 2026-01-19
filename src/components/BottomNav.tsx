'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddEntryModal } from '@/components/AddEntryModal'

export function BottomNav() {
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black pb-safe">
        <div className="flex h-16 items-center justify-around px-4">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1",
              pathname === "/" ? "text-blue-500" : "text-gray-400"
            )}
          >
            <LayoutDashboard size={24} />
            <span className="text-xs">Progress</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>

          <Link
            href="/career"
            className={cn(
              "flex flex-col items-center gap-1",
              pathname === "/career" ? "text-blue-500" : "text-gray-400"
            )}
          >
            <Briefcase size={24} />
            <span className="text-xs">Career</span>
          </Link>
        </div>
      </div>

      <AddEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
