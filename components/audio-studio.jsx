"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AudioWaveformIcon as Waveform,
  Music,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Zap,
  X,
  Settings,
  Download,
  Upload,
  Mic,
  Save,
  Loader2,
} from "lucide-react"

// Audio player component
const AudioTrack = ({ name, url }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio] = useState(new Audio(url))
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [audio])

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Format time
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audio])

  return (
    <div className="flex flex-col p-2 hover:bg-gray-700/50 rounded-lg transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 text-blue-400" />
            ) : (
              <Play className="w-3 h-3 text-blue-400 ml-0.5" />
            )}
          </button>
          <span className="text-sm font-medium">{name}</span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        )}
      </div>
      {isPlaying && (
        <div className="mt-2">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AudioStudio({ podcastAudio, onClose, onAudioUpdate, conversationId }) {
  const [activeTab, setActiveTab] = useState("effects")
  const [volume, setVolume] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [backgroundMusic, setBackgroundMusic] = useState(null)
  const [backgroundVolume, setBackgroundVolume] = useState(30)
  const [selectedEffect, setSelectedEffect] = useState(null)
  const [effectsVolume, setEffectsVolume] = useState(70)
  const [gainNode, setGainNode] = useState(null)
  const fileInputRef = useRef(null)
  const [showWaveform, setShowWaveform] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")

  const audioRef = useRef(null)
  const backgroundAudioRef = useRef(null)
  const effectAudioRef = useRef(null)
  const audioContextRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const [filters, setFilters] = useState({
    low: 0,
    mid: 0,
    high: 0,
    compression: 0,
    reverb: 0,
  })

  const lowFilterRef = useRef(null)
  const midFilterRef = useRef(null)
  const highFilterRef = useRef(null)
  const compressorRef = useRef(null)
  const reverbRef = useRef(null)

  // Add this ref to store the source
  const sourceNodeRef = useRef(null)

  // Add these state variables at the top with other states
  const [uploadedMusic, setUploadedMusic] = useState(null)
  const [uploadedEffects, setUploadedEffects] = useState([])

  // Add new state for tracking modifications
  const [isSaving, setIsSaving] = useState(false)

  // Add this to your state declarations
  const [uploadedFile, setUploadedFile] = useState(null)

  // Modify the initialization effect
  useEffect(() => {
    if (!audioRef.current || !podcastAudio) return

    const initAudio = async () => {
      try {
        // Create AudioContext if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }

        // Reset previous connections
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect()
        }

        // Create and connect nodes
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
        const gainNode = audioContextRef.current.createGain()
        setGainNode(gainNode)

        // Connect the basic chain
        sourceNodeRef.current.connect(gainNode).connect(audioContextRef.current.destination)
      } catch (error) {
        console.error("Error initializing audio:", error)
      }
    }

    initAudio()

    // Cleanup
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
      }
      if (gainNode) {
        gainNode.disconnect()
      }
    }
  }, [podcastAudio]) // Depend on podcastAudio instead of audioRef.current

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  // Modify the togglePlayPause function
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume()
      }

      if (isPlaying) {
        await audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error("Playback error:", error)
    }
  }

  // Handle seeking
  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  // Format time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Update background music volume
  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = backgroundVolume / 100
    }
  }, [backgroundVolume])

  // Update effects volume
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = effectsVolume / 100
    }
  }, [effectsVolume, gainNode])

  // Play background music
  const playBackgroundMusic = (musicUrl) => {
    setBackgroundMusic(musicUrl)

    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause()
    }

    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = backgroundVolume / 100

    if (isPlaying) {
      audio.play()
    }

    backgroundAudioRef.current = audio
  }

  // Updated handleMusicUpload function
  const handleMusicUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2), // Convert to MB
        url: objectUrl
      })
      setBackgroundMusic(objectUrl)
    }
  }

  // Add cleanup effect for uploaded audio files
  useEffect(() => {
    return () => {
      // Cleanup uploaded music
      if (uploadedMusic) {
        URL.revokeObjectURL(uploadedMusic.url)
      }
      // Cleanup uploaded effects
      uploadedEffects.forEach((effect) => {
        URL.revokeObjectURL(effect.url)
      })
    }
  }, [uploadedMusic, uploadedEffects])

  // Draw waveform visualization
  useEffect(() => {
    if (!audioContextRef.current || !audioRef.current || !canvasRef.current || !showWaveform) return

    const analyser = audioContextRef.current.createAnalyser()
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    if (sourceNodeRef.current) {
      sourceNodeRef.current.connect(analyser)
    }

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")

    const draw = () => {
      if (!canvas) return

      // Set canvas dimensions to match its display size
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      canvasCtx.scale(dpr, dpr)

      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.clientWidth / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.clientHeight * 0.8

        // Create gradient
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.clientHeight)
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)") // Blue
        gradient.addColorStop(1, "rgba(147, 51, 234, 0.5)") // Purple

        canvasCtx.fillStyle = gradient
        canvasCtx.fillRect(x, canvas.clientHeight - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (analyser) {
        analyser.disconnect()
      }
    }
  }, [audioContextRef.current, audioRef.current, canvasRef.current, showWaveform, isPlaying])

  // Updated background music tracks
  const backgroundMusicTracks = [
    {
      id: "1",
      name: "Instrumental",
      category: "instrumental",
      url: "/audio/background/background-music-instrumental-207886.mp3", // Replace with your audio file path
    },
    {
      id: "2",
      name: "Soft Piano",
      category: "ambient",
      url: "/audio/background/soft-piano-music-312509.mp3",
    },
    {
      id: "3",
      name: "Technology",
      category: "ambient",
      url: "/audio/background/this-minimal-technology_pure-12327.mp3",
    },
    {
      id: "4",
      name: "Lofi",
      category: "ambient",
      url: "/audio/background/lofi-ambiant-187409.mp3",
    },
    {
      id: "5",
      name: "Underwater",
      category: "ambient",
      url: "/audio/background/under-water-softness-186421.mp3",
    },
    {
      id: "6",
      name: "Advertising-music",
      category: "ambient",
      url: "/audio/background/architect-tech-corporate-advertising-music-247324.mp3",
    },
    {
      id: "7",
      name: "Penguin",
      category: "ambient",
      url: "/audio/background/penguinmusic-modern-chillout-future-calm-12641.mp3",
    },
  ]

  // Modify the audio processing effect
  useEffect(() => {
    if (!audioContextRef.current || !audioRef.current) return

    try {
      // Create filters
      lowFilterRef.current = audioContextRef.current.createBiquadFilter()
      lowFilterRef.current.type = "lowshelf"
      lowFilterRef.current.frequency.value = 320

      midFilterRef.current = audioContextRef.current.createBiquadFilter()
      midFilterRef.current.type = "peaking"
      midFilterRef.current.frequency.value = 1000

      highFilterRef.current = audioContextRef.current.createBiquadFilter()
      highFilterRef.current.type = "highshelf"
      highFilterRef.current.frequency.value = 3200

      // Create compressor
      compressorRef.current = audioContextRef.current.createDynamicsCompressor()

      // Create source only if it doesn't exist
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
      }

      // Connect the audio chain
      sourceNodeRef.current
        .connect(lowFilterRef.current)
        .connect(midFilterRef.current)
        .connect(highFilterRef.current)
        .connect(compressorRef.current)
        .connect(audioContextRef.current.destination)

      // Cleanup function
      return () => {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect()
        }
        if (lowFilterRef.current) lowFilterRef.current.disconnect()
        if (midFilterRef.current) midFilterRef.current.disconnect()
        if (highFilterRef.current) highFilterRef.current.disconnect()
        if (compressorRef.current) compressorRef.current.disconnect()
      }
    } catch (error) {
      console.error("Error setting up audio processing:", error)
    }
  }, [audioContextRef.current, audioRef.current])

  const handleEQChange = (value, type) => {
    const newFilters = { ...filters, [type]: value[0] }
    setFilters(newFilters)

    switch (type) {
      case "low":
        if (lowFilterRef.current) lowFilterRef.current.gain.value = value[0]
        break
      case "mid":
        if (midFilterRef.current) midFilterRef.current.gain.value = value[0]
        break
      case "high":
        if (highFilterRef.current) highFilterRef.current.gain.value = value[0]
        break
      case "compression":
        if (compressorRef.current) {
          compressorRef.current.threshold.value = -50 + value[0] * 50
        }
        break
      case "reverb":
        if (reverbRef.current) {
          reverbRef.current.decay.value = value[0] / 100
        }
        break
    }
  }

  const filteredMusicTracks =
    activeCategory === "all"
      ? backgroundMusicTracks
      : backgroundMusicTracks.filter((track) => track.category === activeCategory)

  // Add save modifications handler
  const handleSaveModifications = async () => {
    setIsSaving(true)
    try {
      const audioBlob = await getProcessedAudioBlob()
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'processed_audio.wav')
      
      // Add conversationId to FormData
      if (!conversationId) {
        throw new Error('Conversation ID is required')
      }
      formData.append('conversationId', conversationId)
      
      if (backgroundMusic) {
        formData.append('backgroundSound', backgroundMusic)
        formData.append('backgroundVolume', backgroundVolume.toString())
      }
      
      formData.append('effects', JSON.stringify({
        low: filters.low,
        mid: filters.mid,
        high: filters.high,
        compression: filters.compression,
        reverb: filters.reverb
      }))

      const response = await fetch('/api/audio-modifications', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save modifications')
      }

      const data = await response.json()
      console.log('Modifications saved successfully:', data)
      
      if (data.audio) {
        const audioUrl = `data:audio/wav;base64,${data.audio}`
        if (typeof onAudioUpdate === 'function') {
          onAudioUpdate(audioUrl)
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving modifications:', error)
      alert('Failed to save modifications: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Add this function inside the AudioStudio component
  const getProcessedAudioBlob = async () => {
    try {
      // Get the current audio element
      const audio = audioRef.current
      
      // Create an offline audio context
      const offlineCtx = new OfflineAudioContext({
        numberOfChannels: 2,
        length: Math.ceil(44100 * audio.duration),
        sampleRate: 44100,
      })

      // First, we need to fetch the audio data
      const response = await fetch(audio.src)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)

      // Create buffer source instead of media element source
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer

      // Create audio processing nodes
      const gainNode = offlineCtx.createGain()
      const lowFilter = offlineCtx.createBiquadFilter()
      const midFilter = offlineCtx.createBiquadFilter()
      const highFilter = offlineCtx.createBiquadFilter()
      const compressor = offlineCtx.createDynamicsCompressor()

      // Apply current effect settings
      gainNode.gain.value = effectsVolume / 100

      // Configure filters
      lowFilter.type = 'lowshelf'
      lowFilter.frequency.value = 320
      lowFilter.gain.value = filters.low

      midFilter.type = 'peaking'
      midFilter.frequency.value = 1000
      midFilter.Q.value = 0.5
      midFilter.gain.value = filters.mid

      highFilter.type = 'highshelf'
      highFilter.frequency.value = 3200
      highFilter.gain.value = filters.high

      // Configure compressor
      compressor.threshold.value = -50 + (filters.compression * 0.5)
      compressor.knee.value = 40
      compressor.ratio.value = 12
      compressor.attack.value = 0
      compressor.release.value = 0.25

      // Connect the audio nodes
      source.connect(lowFilter)
      lowFilter.connect(midFilter)
      midFilter.connect(highFilter)
      highFilter.connect(compressor)
      compressor.connect(gainNode)
      gainNode.connect(offlineCtx.destination)

      // If there's background music, mix it in
      if (backgroundMusic) {
        try {
          const bgResponse = await fetch(backgroundMusic)
          const bgArrayBuffer = await bgResponse.arrayBuffer()
          const bgAudioBuffer = await offlineCtx.decodeAudioData(bgArrayBuffer)
          
          const bgSource = offlineCtx.createBufferSource()
          bgSource.buffer = bgAudioBuffer
          
          const bgGain = offlineCtx.createGain()
          bgGain.gain.value = backgroundVolume / 100
          
          bgSource.connect(bgGain)
          bgGain.connect(offlineCtx.destination)
          bgSource.start()
        } catch (error) {
          console.error('Error mixing background music:', error)
        }
      }

      // Start the source and render
      source.start()
      const renderedBuffer = await offlineCtx.startRendering()

      // Convert to WAV
      const wavData = audioBufferToWav(renderedBuffer)
      return new Blob([wavData], { type: 'audio/wav' })

    } catch (error) {
      console.error('Error processing audio:', error)
      throw new Error('Failed to process audio')
    }
  }

  // Helper function to convert AudioBuffer to WAV format
  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2
    const buffer2 = new ArrayBuffer(44 + length)
    const view = new DataView(buffer2)
    const channels = []
    let sample
    let offset = 0
    let pos = 0

    // Write WAV header
    setUint32(0x46464952)                         // "RIFF"
    setUint32(36 + length)                        // file length
    setUint32(0x45564157)                         // "WAVE"
    setUint32(0x20746d66)                         // "fmt " chunk
    setUint32(16)                                 // length = 16
    setUint16(1)                                  // PCM (uncompressed)
    setUint16(numOfChan)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * numOfChan)  // avg. bytes/sec
    setUint16(numOfChan * 2)                      // block-align
    setUint16(16)                                 // 16-bit
    setUint32(0x61746164)                         // "data" - chunk
    setUint32(length)                             // chunk length

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    while (pos < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]))
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
        view.setInt16(44 + offset, sample, true)
        offset += 2
      }
      pos++
    }

    function setUint16(data) {
      view.setUint16(pos, data, true)
      pos += 2
    }

    function setUint32(data) {
      view.setUint32(pos, data, true)
      pos += 4
    }

    return buffer2
  }

  // Add this click handler function
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Sound Design Studio
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveModifications}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-sm transition-colors flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Modifications
              </>
            )}
          </Button>
          <button onClick={onClose} className="p-2 hover:bg-gray-800/80 rounded-full transition-all duration-200">
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Main Audio Player */}
        <div className="p-6 border-b border-gray-800/50 bg-gradient-to-b from-gray-900/50 to-gray-900/10">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-full h-24 mb-2">
              {showWaveform ? (
                <canvas ref={canvasRef} className="w-full h-full rounded-lg bg-gray-900/50 backdrop-blur-sm" />
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWaveform(true)}
                    className="bg-gray-800/70 border-gray-700/50 hover:bg-gray-700/70"
                  >
                    <Waveform className="w-4 h-4 mr-2" />
                    Show Waveform
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-700/50 bg-gray-800/70 hover:bg-gray-700/70"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
                  }
                }}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-700/50 bg-gray-800/70 hover:bg-gray-700/70"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
                  }
                }}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 w-full">
              <div className="flex justify-between text-sm text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 mt-4 bg-gray-800/50 px-4 py-2 rounded-full">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="w-32"
              />
              <span className="text-xs text-gray-400 min-w-[30px] text-right">{volume}%</span>
            </div>

            <audio
              ref={audioRef}
              src={podcastAudio}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              preload="metadata"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Audio Tools Tabs */}
        <Tabs defaultValue="effects" className="p-4" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4 bg-gray-800/50 p-1">
            <TabsTrigger
              value="effects"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/80 data-[state=active]:to-purple-600/80"
            >
              <Zap className="h-4 w-4" /> Effects
            </TabsTrigger>
            <TabsTrigger
              value="background"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/80 data-[state=active]:to-purple-600/80"
            >
              <Music className="h-4 w-4" /> Background Music
            </TabsTrigger>
          </TabsList>

          <TabsContent value="effects">
            <Card className="bg-gray-800/30 border-gray-700/30 backdrop-blur-sm">
              <CardHeader className="bg-gray-800/50 rounded-t-lg border-b border-gray-700/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-400" /> Audio Effects
                </CardTitle>
                <CardDescription>Enhance your podcast with professional audio effects</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-blue-300">
                      <span className="h-1 w-1 rounded-full bg-blue-400"></span>
                      Equalizer
                    </h3>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Low (Bass)</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-blue-300">
                            {filters.low} dB
                          </span>
                        </div>
                        <Slider
                          value={[filters.low]}
                          min={-12}
                          max={12}
                          step={1}
                          onValueChange={(value) => handleEQChange(value, "low")}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Mid</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-blue-300">
                            {filters.mid} dB
                          </span>
                        </div>
                        <Slider
                          value={[filters.mid]}
                          min={-12}
                          max={12}
                          step={1}
                          onValueChange={(value) => handleEQChange(value, "mid")}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">High (Treble)</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-blue-300">
                            {filters.high} dB
                          </span>
                        </div>
                        <Slider
                          value={[filters.high]}
                          min={-12}
                          max={12}
                          step={1}
                          onValueChange={(value) => handleEQChange(value, "high")}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-purple-300">
                      <span className="h-1 w-1 rounded-full bg-purple-400"></span>
                      Dynamics & Space
                    </h3>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Compression</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-purple-300">
                            {filters.compression}%
                          </span>
                        </div>
                        <Slider
                          value={[filters.compression]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => handleEQChange(value, "compression")}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Reverb</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-purple-300">
                            {filters.reverb}%
                          </span>
                        </div>
                        <Slider
                          value={[filters.reverb]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => handleEQChange(value, "reverb")}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="background">
            <Card className="bg-gray-800/30 border-gray-700/30 backdrop-blur-sm">
              <CardHeader className="bg-gray-800/50 rounded-t-lg border-b border-gray-700/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music className="h-5 w-5 text-blue-400" /> Background Music
                </CardTitle>
                <CardDescription>Add background music to enhance your podcast</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6 bg-gray-800/50 px-4 py-2 rounded-full">
                  <Volume2 className="h-4 w-4 text-gray-400" />
                  <Slider
                    value={[backgroundVolume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setBackgroundVolume(value[0])}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400 min-w-[30px] text-right">{backgroundVolume}%</span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                    <Button
                      variant={activeCategory === "all" ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${activeCategory === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800/50 border-gray-700/50"}`}
                      onClick={() => setActiveCategory("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={activeCategory === "instrumental" ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${activeCategory === "instrumental" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800/50 border-gray-700/50"}`}
                      onClick={() => setActiveCategory("instrumental")}
                    >
                      Instrumental
                    </Button>
                    <Button
                      variant={activeCategory === "ambient" ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${activeCategory === "ambient" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800/50 border-gray-700/50"}`}
                      onClick={() => setActiveCategory("ambient")}
                    >
                      Ambient
                    </Button>
                    {/* <Button
                      variant={activeCategory === "custom" ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${activeCategory === "custom" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800/50 border-gray-700/50"}`}
                      onClick={() => setActiveCategory("custom")}
                    >
                      My Uploads
                    </Button> */}
                  </div>

                  <ScrollArea className="h-[240px] pr-4 mb-4 bg-gray-900/30 rounded-lg p-2">
                    <div className="space-y-1">
                      {filteredMusicTracks.map((track) => (
                        <div
                          key={track.id}
                          className={`flex items-center justify-between p-2 ${backgroundMusic === track.url ? "bg-blue-900/30 border border-blue-500/30" : "hover:bg-gray-700/30"} rounded-lg transition-colors cursor-pointer`}
                          onClick={() => playBackgroundMusic(track.url)}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              className={`p-2 ${backgroundMusic === track.url ? "bg-blue-600/50" : "bg-gray-800/80"} hover:bg-gray-700 rounded-full transition-colors flex items-center justify-center`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (backgroundMusic === track.url) {
                                  if (backgroundAudioRef.current?.paused) {
                                    backgroundAudioRef.current.play()
                                  } else {
                                    backgroundAudioRef.current?.pause()
                                  }
                                } else {
                                  playBackgroundMusic(track.url)
                                }
                              }}
                            >
                              {backgroundMusic === track.url && !backgroundAudioRef.current?.paused ? (
                                <Pause className="w-3 h-3 text-white" />
                              ) : (
                                <Play className="w-3 h-3 text-white ml-0.5" />
                              )}
                            </button>
                            <div>
                              <p className="text-sm font-medium">{track.name}</p>
                              <p className="text-xs text-gray-400">{track.category}</p>
                            </div>
                          </div>
                          {backgroundMusic === track.url && (
                            <div className="flex items-center gap-1">
                              <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></span>
                              <span className="w-1 h-6 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                              <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse delay-150"></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {!uploadedFile ? (
                  <div 
                    onClick={handleUploadClick} 
                    className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80 border-2 border-dashed border-gray-700 rounded-lg p-4"
                  >
                    <Upload className="h-6 w-6 mb-2 text-blue-400" />
                    <p className="text-sm text-gray-300 mb-2">Upload your own background music</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="music-upload"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                    />
                  </div>
                ) : (
                  <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Music className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-400">{uploadedFile.size} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null)
                          setBackgroundMusic(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                      </button>
                    </div>
                    <audio
                      src={uploadedFile.url}
                      controls
                      className="w-full h-[32px] accent-blue-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

