"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Hls from 'hls.js'

interface VideoPlayerProps {
  product: {
    id: string
    videoUrl: string
    name: string
  }
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  priority?: boolean
}

const VideoPlayer = memo(({ 
  product, 
  autoPlay = true, 
  muted = true, 
  loop = true,
  priority = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const autoplayAttemptedRef = useRef(false)

  // Check if URL is HLS stream
  const isHlsStream = useCallback((url: string) => {
    return url?.toLowerCase().includes('.m3u8')
  }, [])

  // Simple HLS initialization
  const initializeHls = useCallback(() => {
    const video = videoRef.current
    if (!video || !product.videoUrl) return

    // Clean up existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported() && isHlsStream(product.videoUrl)) {
      console.log('Initializing HLS.js for:', product.videoUrl)
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        
        // Network settings
        fragLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 2,
        
        autoStartLoad: true,
        startPosition: -1,
        debug: false,
      })

      hlsRef.current = hls

      // Single event handler for successful load
      const handleManifestParsed = () => {
        console.log('HLS manifest parsed successfully')
        setIsLoading(false)
        setHasError(false)
        setHasLoaded(true)
      }

      // Single error handler
      const handleError = (event: string, data: any) => {
        console.warn('HLS warning:', data.details)
        
        // Ignore non-fatal errors
        if (data.details === 'bufferStalledError' || 
            data.details === 'fragLoadTimeOut' || 
            data.details === 'levelLoadTimeOut') {
          return
        }

        if (data.fatal) {
          console.error('HLS fatal error:', data)
          setHasError(true)
          setIsLoading(false)
        }
      }

      // Only set up these two listeners
      hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed)
      hls.on(Hls.Events.ERROR, handleError)

      try {
        hls.loadSource(product.videoUrl)
        hls.attachMedia(video)
      } catch (error) {
        console.error('HLS load failed:', error)
        setHasError(true)
        setIsLoading(false)
      }

    } else {
      // Regular video or native HLS (Safari)
      console.log('Using native video player for:', product.videoUrl)
      video.src = product.videoUrl
      setHasLoaded(true)
      setIsLoading(false)
    }
  }, [product.videoUrl, isHlsStream])

  // Clean up HLS instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  // Single autoplay attempt function
  const attemptAutoplay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !hasLoaded || autoplayAttemptedRef.current) return

    try {
      autoplayAttemptedRef.current = true
      await video.play()
      setIsPlaying(true)
      setNeedsInteraction(false)
      console.log('Autoplay successful')
    } catch (error) {
      console.log('Autoplay prevented, needs interaction')
      setNeedsInteraction(true)
    }
  }, [hasLoaded])

  // Intersection Observer - simplified
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      
      if (entry.isIntersecting) {
        // Video is visible - load and try to play
        if (!hasLoaded && !isLoading && !hasError) {
          setIsLoading(true)
          initializeHls()
        } else if (hasLoaded && autoPlay && !isPlaying) {
          attemptAutoplay()
        }
      } else {
        // Video is not visible - pause if not looping
        if (isPlaying && !loop) {
          video.pause()
          setIsPlaying(false)
        }
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.3,
      rootMargin: "100px"
    })

    observerRef.current.observe(video)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [autoPlay, hasLoaded, isLoading, hasError, isPlaying, loop, initializeHls, attemptAutoplay])

  // Video event handlers - simplified
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      console.log('Video can play')
      setIsLoading(false)
      setHasLoaded(true)
      setHasError(false)
    }

    const handleError = () => {
      console.error('Video error')
      setHasError(true)
      setIsLoading(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setNeedsInteraction(false)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    // Only essential event listeners
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    // Initialize immediately if priority
    if (priority && product.videoUrl) {
      setIsLoading(true)
      initializeHls()
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      
      destroyHls()
      if (video.src) {
        video.src = ''
        video.load()
      }
    }
  }, [priority, product.videoUrl, initializeHls, destroyHls])

  const handlePlayClick = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (video.paused) {
        await video.play()
      } else {
        video.pause()
      }
    } catch (error) {
      console.error('Play failed:', error)
      setNeedsInteraction(true)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    setHasLoaded(false)
    autoplayAttemptedRef.current = false
    destroyHls()
    
    // Reinitialize
    setTimeout(() => {
      initializeHls()
    }, 300)
  }, [initializeHls, destroyHls])

  // Determine if we should show video
  const showVideo = hasLoaded && !hasError

  return (
    <div className="relative aspect-video bg-black overflow-hidden group">
      {/* Loading state - only show when actually loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center text-muted-foreground">
            <p className="text-sm mb-2">Failed to load video</p>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Play button - Only show if autoplay was prevented and video is paused */}
      {needsInteraction && !isPlaying && showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer">
          <Button
            onClick={handlePlayClick}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0"
            size="lg"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        muted={muted}
        loop={loop}
        playsInline
        preload="none" // Let intersection observer handle loading
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          showVideo ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={`Video demonstration of ${product.name}`}
        disablePictureInPicture
      />

      {/* Play/pause button - only show on hover */}
      {showVideo && (
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <Button
            onClick={handlePlayClick}
            variant="ghost"
            size="sm"
            className="bg-black/50 hover:bg-black/70 text-white"
          >
            {isPlaying ? (
              <div className="w-4 h-4 bg-white" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </Button>
        </div>
      )}

      {/* Loading progress indicator - only show when loading */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 z-20">
          <div className="h-full bg-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer


