import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddStore } from '../state/addStore'
import { CameraIcon, ImageIcon, XIcon } from '../components/icons'

export function Camera() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fallbackRef = useRef<HTMLInputElement>(null)
  const activeRef = useRef(true)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    activeRef.current = true
    void start(facing)
    return () => {
      activeRef.current = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing])

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function start(f: 'environment' | 'user') {
    stop()
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: f, width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false,
      })
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
    } catch {
      setError('无法打开相机，请检查权限，或使用系统相机拍摄')
    }
  }

  function shoot() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        useAddStore.getState().setPending([{ blob, source: 'camera' }])
        navigate('/processing')
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <input
        ref={fallbackRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          useAddStore.getState().setPending([{ blob: f, source: 'camera' }])
          navigate('/processing')
        }}
      />

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-contain"
        />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-stone-900 px-8 text-center">
            <CameraIcon className="h-10 w-10 text-stone-500" />
            <p className="text-sm text-stone-300">{error}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fallbackRef.current?.click()}
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white"
              >
                打开系统相机
              </button>
              <button
                type="button"
                onClick={() => history.back()}
                className="rounded-full bg-stone-700 px-5 py-2 text-sm text-stone-200"
              >
                返回
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => history.back()}
          aria-label="关闭"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <XIcon className="h-5 w-5" />
        </button>
        {!error && (
          <button
            type="button"
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            className="absolute right-4 top-4 rounded-full bg-black/40 px-3.5 py-2 text-xs text-white backdrop-blur"
          >
            切换镜头
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-10 py-7" style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          onClick={() => {
            stop()
            fallbackRef.current?.removeAttribute('capture')
            fallbackRef.current?.click()
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="从相册选择"
        >
          <ImageIcon className="h-5.5 w-5.5" />
        </button>
        <button
          type="button"
          onClick={shoot}
          disabled={!!error}
          aria-label="拍照"
          className="flex h-18 w-18 items-center justify-center rounded-full bg-white/25 ring-4 ring-white active:scale-95 disabled:opacity-40"
        >
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>
        <span className="h-11 w-11" />
      </div>
    </div>
  )
}
