'use client'

import dynamic from 'next/dynamic'

const ActivityDetailsClient = dynamic(
  () => import('@/components/ActivityDetailsClient'),
  { ssr: false }
)

export default function ActivityDetailsPage() {
  return <ActivityDetailsClient />
}
