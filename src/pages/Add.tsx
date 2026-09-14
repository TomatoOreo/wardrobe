import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/Header'
import { CameraIcon, ImageIcon, ImportIcon } from '../components/icons'
import { useAddStore } from '../state/addStore'
import { getSetting, setSetting } from '../db/db'
import type { ItemSource } from '../db/consts'

export function Add() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const sourceRef = useRef<ItemSource>('album')
  const [dragOver, setDragOver] = useState(false)
  const autoCutout = useLiveQuery(() => getSetting('autoCutout', true), [], true)

  const handleFiles = (files: File[], source: ItemSource) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return
    useAddStore.getState().setPending(imgs.map((blob) => ({ blob, source })))
    navigate('/processing')
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length) handleFiles(files, 'import')
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pick = (source: ItemSource) => {
    sourceRef.current = source
    fileRef.current?.click()
  }

  return (
    <div
      className="pb-28"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(Array.from(e.dataTransfer.files), 'import')
      }}
    >
      <Header title="添加衣物" back />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []), sourceRef.current)
          e.target.value = ''
        }}
      />

      <main
        className={`mx-auto max-w-lg space-y-3 px-4 pt-5 ${dragOver ? 'rounded-2xl ring-2 ring-dashed ring-orange-400' : ''}`}
      >
        <SourceCard
          icon={<CameraIcon className="h-6 w-6" />}
          title="拍照"
          desc="调用相机拍摄衣服（平铺或挂拍效果最好）"
          onClick={() => navigate('/camera')}
        />
        <SourceCard
          icon={<ImageIcon className="h-6 w-6" />}
          title="从相册选择"
          desc="选择手机相册里的衣服照片"
          onClick={() => pick('album')}
        />
        <SourceCard
          icon={<ImportIcon className="h-6 w-6" />}
          title="从其他 App 导入"
          desc="把淘宝 / 小红书等保存的图片导入；电脑上可直接拖拽或粘贴截图"
          onClick={() => pick('import')}
        />

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 ring-1 ring-stone-200/70">
          <div>
            <p className="text-sm font-medium text-stone-700">自动抠图</p>
            <p className="mt-0.5 text-xs text-stone-400">添加时自动去掉背景，可随时在详情里重试</p>
          </div>
          <Switch
            checked={autoCutout}
            onChange={(v) => void setSetting('autoCutout', v)}
          />
        </div>

        <div className="rounded-2xl bg-orange-50 px-4 py-3 text-xs leading-relaxed text-orange-700/80">
          💡 小提示：iPhone 上从其他 App 分享图片时，先保存到相册，再选「从相册选择」即可；
          也可以直接截图后在这里粘贴。
        </div>
      </main>
    </div>
  )
}

function SourceCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-stone-200/70 transition active:scale-[0.99] active:bg-stone-100"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-stone-800">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-stone-400">{desc}</span>
      </span>
    </button>
  )
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-orange-500' : 'bg-stone-300'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
