'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddEntryModal } from '@/components/AddEntryModal'

export function BottomNav() {
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe"
      >
        <div className="flex h-16 items-center justify-around px-4">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors",
              pathname === "/" ? "text-foreground" : "text-muted"
            )}
          >
            <LayoutDashboard size={22} />
            <span>Progress</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center bg-surface-raised text-foreground border border-border-strong active:opacity-75 transition-opacity"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <AddEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
