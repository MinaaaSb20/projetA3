"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"
import { formatDistanceToNow } from "date-fns"
import ButtonAccount from "@/components/ButtonAccount"
import ButtonCheckout from "@/components/ButtonCheckout"
import config from "@/config"
import Link from "next/link"

// Helper function to format duration from seconds
function formatDuration(seconds) {
  if (!seconds) return "N/A"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function Dashboard({
  user,
  podcastCount,
  exportsCount,
  voiceAnalytics,
  effectsAnalytics,
  backgroundSoundsAnalytics,
  userPodcasts,
  podcastProductionAnalytics,
  onPodcastsUpdate,
}) {
  const voiceChartRef = useRef(null)
  const effectsChartRef = useRef(null)
  const backgroundSoundsChartRef = useRef(null)
  const productionChartRef = useRef(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    // Voice usage chart
    if (voiceChartRef.current && voiceAnalytics.length > 0) {
      const voiceChart = new Chart(voiceChartRef.current, {
        type: "doughnut",
        data: {
          labels: voiceAnalytics.map((voice) => voice.name || voice._id),
          datasets: [
            {
              data: voiceAnalytics.map((voice) => voice.count),
              backgroundColor: [
                "rgba(147, 51, 234, 0.8)",
                "rgba(168, 85, 247, 0.8)",
                "rgba(192, 132, 252, 0.8)",
                "rgba(216, 180, 254, 0.8)",
                "rgba(233, 213, 255, 0.8)",
              ],
              borderColor: "rgba(17, 24, 39, 1)",
              borderWidth: 2,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "rgba(229, 231, 235, 1)",
                font: {
                  size: 12,
                },
                padding: 20,
              },
            },
            title: {
              display: true,
              text: "Voice Usage Distribution",
              color: "rgba(229, 231, 235, 1)",
              font: {
                size: 16,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
          },
          cutout: "65%",
        },
      })

      return () => voiceChart.destroy()
    }
  }, [voiceAnalytics])

  useEffect(() => {
    // Effects usage chart
    if (effectsChartRef.current && effectsAnalytics.length > 0) {
      const effectsChart = new Chart(effectsChartRef.current, {
        type: "bar",
        data: {
          labels: effectsAnalytics.map((effect) => effect._id.charAt(0).toUpperCase() + effect._id.slice(1)),
          datasets: [
            {
              label: "Usage Count",
              data: effectsAnalytics.map((effect) => effect.count),
              backgroundColor: "rgba(20, 184, 166, 0.7)",
              borderColor: "rgba(13, 148, 136, 1)",
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(20, 184, 166, 1)",
            },
            {
              label: "Average Value",
              data: effectsAnalytics.map((effect) => effect.avgValue),
              backgroundColor: "rgba(56, 189, 248, 0.7)",
              borderColor: "rgba(14, 165, 233, 1)",
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(56, 189, 248, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          scales: {
            x: {
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
              ticks: {
                color: "rgba(209, 213, 219, 1)",
              },
            },
            y: {
              grid: {
                display: false,
              },
              ticks: {
                color: "rgba(209, 213, 219, 1)",
              },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "rgba(229, 231, 235, 1)",
                padding: 20,
              },
            },
            title: {
              display: true,
              text: "Effects Usage & Average Values",
              color: "rgba(229, 231, 235, 1)",
              font: {
                size: 16,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
          },
        },
      })

      return () => effectsChart.destroy()
    }
  }, [effectsAnalytics])

  useEffect(() => {
    // Background sounds chart
    if (backgroundSoundsChartRef.current && backgroundSoundsAnalytics.length > 0) {
      const backgroundSoundsChart = new Chart(backgroundSoundsChartRef.current, {
        type: "polarArea",
        data: {
          labels: backgroundSoundsAnalytics.map((sound) => sound._id.split("/").pop().replace(".mp3", "")),
          datasets: [
            {
              data: backgroundSoundsAnalytics.map((sound) => sound.count),
              backgroundColor: [
                "rgba(59, 130, 246, 0.7)",
                "rgba(99, 102, 241, 0.7)",
                "rgba(139, 92, 246, 0.7)",
                "rgba(168, 85, 247, 0.7)",
                "rgba(217, 70, 239, 0.7)",
              ],
              borderWidth: 1,
              borderColor: "rgba(17, 24, 39, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              ticks: {
                display: false,
              },
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "rgba(229, 231, 235, 1)",
                padding: 20,
              },
            },
            title: {
              display: true,
              text: "Background Sounds Usage",
              color: "rgba(229, 231, 235, 1)",
              font: {
                size: 16,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
          },
        },
      })

      return () => backgroundSoundsChart.destroy()
    }
  }, [backgroundSoundsAnalytics])

  useEffect(() => {
    // Production analytics chart
    if (productionChartRef.current && podcastProductionAnalytics?.length > 0) {
      const dates = podcastProductionAnalytics.map((day) => {
        const date = new Date(day._id)
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      })

      const completedData = podcastProductionAnalytics.map((day) => day.completed)
      const processingData = podcastProductionAnalytics.map((day) => day.processing)

      const productionChart = new Chart(productionChartRef.current, {
        type: "line",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Completed",
              data: completedData,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "rgba(34, 197, 94, 1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgba(34, 197, 94, 1)",
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: "Processing",
              data: processingData,
              backgroundColor: "rgba(234, 179, 8, 0.2)",
              borderColor: "rgba(234, 179, 8, 1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgba(234, 179, 8, 1)",
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
              ticks: {
                color: "rgba(209, 213, 219, 1)",
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
              ticks: {
                color: "rgba(209, 213, 219, 1)",
                precision: 0,
              },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "rgba(229, 231, 235, 1)",
                padding: 20,
              },
            },
            title: {
              display: true,
              text: "Podcast Production (Last 30 Days)",
              color: "rgba(229, 231, 235, 1)",
              font: {
                size: 16,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
        },
      })

      return () => productionChart.destroy()
    }
  }, [podcastProductionAnalytics])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleDeletePodcast = async (podcastId) => {
    if (!confirm('Are you sure you want to delete this podcast?')) {
      return;
    }

    try {
      const response = await fetch(`/api/podcasts/${podcastId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete podcast');
      }

      const updatedPodcasts = userPodcasts.filter(podcast => podcast._id !== podcastId);
      onPodcastsUpdate(updatedPodcasts);
      showToast('Podcast deleted successfully');

    } catch (error) {
      console.error('Error deleting podcast:', error);
      showToast('Failed to delete podcast', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Glassmorphism */}
        <div className="relative bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl p-6 mb-8" style={{ zIndex: 50 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Welcome back, {user.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 relative" style={{ zIndex: 51 }}>
              <ButtonAccount />
              {!user.hasAccess && (
                <ButtonCheckout 
                  mode="subscription" 
                  priceId={config.stripe.plans[0].priceId} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ zIndex: 40 }}>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all hover:shadow-purple-500/10 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm font-medium">Total Podcasts</h3>
              <span className="p-2 bg-purple-500/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  ></path>
                </svg>
              </span>
            </div>
            <p className="text-4xl font-bold mt-2">{podcastCount}</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
                Audio Content
              </span>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-blue-500/30 transition-all hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm font-medium">Total Exports</h3>
              <span className="p-2 bg-blue-500/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
              </span>
            </div>
            <p className="text-4xl font-bold mt-2">{exportsCount}</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 00-1.414-1.414L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Downloaded
              </span>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-teal-500/30 transition-all hover:shadow-teal-500/10">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm font-medium">Completion Rate</h3>
              <span className="p-2 bg-teal-500/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </span>
            </div>
            <p className="text-4xl font-bold mt-2">
              {podcastProductionAnalytics && podcastProductionAnalytics.length > 0
                ? `${Math.round(
                    (podcastProductionAnalytics.reduce((acc, day) => acc + day.completed, 0) /
                      podcastProductionAnalytics.reduce((acc, day) => acc + day.count, 0)) *
                      100,
                  )}%`
                : "N/A"}
            </p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-teal-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Success Rate
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="relative" style={{ zIndex: 30 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Analytics */}
            <div className="lg:col-span-1 space-y-8">
              {/* Voice Usage Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all hover:shadow-purple-500/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    ></path>
                  </svg>
                  Top Voices
                </h2>
                <div className="h-64 relative">
                  {voiceAnalytics.length > 0 ? (
                    <canvas ref={voiceChartRef}></canvas>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">No voice data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Sounds Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-blue-500/30 transition-all hover:shadow-blue-500/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    ></path>
                  </svg>
                  Background Sounds
                </h2>
                <div className="h-64 relative">
                  {backgroundSoundsAnalytics.length > 0 ? (
                    <canvas ref={backgroundSoundsChartRef}></canvas>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">No background sounds data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Effects & Production */}
            <div className="lg:col-span-2 space-y-8">
              {/* Effects Usage Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-teal-500/30 transition-all hover:shadow-teal-500/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    ></path>
                  </svg>
                  Effects Usage
                </h2>
                <div className="h-80 relative">
                  {effectsAnalytics.length > 0 ? (
                    <canvas ref={effectsChartRef}></canvas>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">No effects data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Podcast Production Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-green-500/30 transition-all hover:shadow-green-500/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                  Podcast Production
                </h2>
                <div className="h-80 relative">
                  {podcastProductionAnalytics && podcastProductionAnalytics.length > 0 ? (
                    <canvas ref={productionChartRef}></canvas>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">No production data available</p>
                    </div>
                  )}
                </div>

                {podcastProductionAnalytics && podcastProductionAnalytics.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Total Created</p>
                      <p className="text-2xl font-semibold">
                        {podcastProductionAnalytics.reduce((acc, day) => acc + day.count, 0)}
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Completed</p>
                      <p className="text-2xl font-semibold text-green-500">
                        {podcastProductionAnalytics.reduce((acc, day) => acc + day.completed, 0)}
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Processing</p>
                      <p className="text-2xl font-semibold text-yellow-500">
                        {podcastProductionAnalytics.reduce((acc, day) => acc + day.processing, 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Podcast List */}
          <div className="mt-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        ></path>
                      </svg>
                      Your Podcasts
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">All your podcast episodes</p>
                  </div>
                  <Link href="/openai-demo" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                    New Podcast
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                {userPodcasts.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {userPodcasts.map((podcast) => (
                        <tr key={podcast._id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                  />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium">
                                  {podcast.title || podcast.conversation?.[0]?.title || "No Title"}
                                </div>
                                <div className="text-xs text-gray-400 truncate max-w-xs">
                                  {podcast.description || podcast.scriptContent?.substring(0, 60) + "..."}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDuration(podcast.duration)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {podcast.createdAt ? (
                              <div>
                                <div>{new Date(podcast.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(podcast.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                podcast.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : podcast.status === "processing"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {podcast.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            <div className="flex space-x-2">
                              <button className="p-1 hover:text-blue-400 transition-colors" title="Edit">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button className="p-1 hover:text-green-400 transition-colors" title="Download">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeletePodcast(podcast._id)}
                                className="p-1 hover:text-red-400 transition-colors" 
                                title="Delete"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <div className="bg-gray-700/30 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-300">No podcasts yet</h3>
                    <p className="mt-1 text-sm text-gray-400">Get started by creating your first podcast.</p>
                    <Link href="/openai-demo" className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors inline-flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                      </svg>
                      Create New Podcast
                    </Link>
                  </div>
                )}
              </div>

              {userPodcasts.length > 10 && (
                <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{" "}
                    <span className="font-medium">{userPodcasts.length}</span> podcasts
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-600 rounded-md text-sm hover:bg-gray-700 transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1 bg-purple-600 border border-purple-600 rounded-md text-sm hover:bg-purple-700 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </main>
  )
}

