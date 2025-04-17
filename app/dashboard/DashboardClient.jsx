"use client"

import { useState } from "react"
import Dashboard from "@/components/dashboard"

export default function DashboardClient({ initialData }) {
  const [data, setData] = useState(initialData)

  const handlePodcastsUpdate = (updatedPodcasts) => {
    setData(prev => ({
      ...prev,
      userPodcasts: updatedPodcasts
    }))
  }

  return (
    <Dashboard 
      {...data} 
      onPodcastsUpdate={handlePodcastsUpdate}
    />
  )
} 