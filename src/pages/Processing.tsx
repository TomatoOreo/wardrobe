import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { BlobImg } from '../components/BlobImg'
import { toast } from '../components/Toasts'
import { compressOriginal, makeThumb, trimTransparent } from '../lib/image'
import { runCutout } from '../lib/cutout'
import { db, getSetting } from '../db/db'
import { useAddStore } from '../state/addStore'

export function Processing() {
  const navigate = useNavigate()
  const pending = useAddStore((s) => s.pending)
  const addProcessed = useAddStore((s) => s.addProcessed)

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('准备中')
  const [frac, setFrac] = useState(0)
  const [preview, setPreview] = useState<Blob | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!pending.length) {
      navigate('/add', { replace: true })
      return
    }
    void run()

    async function run() {
      const auto = await getSetting('autoCutout', true)
      for (let i = 0; i < pending.length; i++) {
        const src = pending[i]
        setIdx(i)
        setPhase('压缩图片')
        setFrac(0.05)
        setPreview(src.blob)
        const original = await compressOriginal(src.blob)

        let cutout: Blob | null = null
        if (auto) {
          setPhase('AI 抠图中')
          try {
            const png = await runCutout(original, (_label, f) => setFrac(0.25 + f * 0.65))
            cutout = await trimTransparent(png)
          } catch (err) {
            console.error(err)
            toast('这一件抠图失败，之后可在详情里重试')
          }
        }

        setPhase('保存中')
        setFrac(0.95)
        const thumb = await makeThumb(cutout ?? original)
        const now = Date.now() + i
        const id = await db.items.add({
          name: '未命名',
          category: 'uncategorized',
          colors: [],
          seasons: [],
          brand: '',
          price: null,
          notes: '',
          original,
          cutout,
          thumb,
          source: src.source,
          favorite: 0,
          wearCount: 0,
          placement: null,
          createdAt: now,
          updatedAt: now,
        })
        addProcessed(Number(id))
      }

      const first = useAddStore.getState().processedIds[0]
      if (first !== undefined) {
        navigate(`/item/${first}?batch=1`, { replace: true })
      } else {
        navigate('/closet', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = pending.length

  return (
    <div className="pb-28">
      <Header title="处理中" />
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="checker mx-auto aspect-[3/4] w-56 overflow-hidden rounded-2xl ring-1 ring-stone-200/70">
          <BlobImg blob={preview} className="h-full w-full object-contain" />
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          {total > 1 && (
            <span className="font-semibold text-orange-600">
              第 {idx + 1} / {total} 件 ·{' '}
            </span>
          )}
          {phase}
        </p>

        <div className="mx-auto mt-3 h-2 w-64 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${Math.round(frac * 100)}%` }}
          />
        </div>

        <p className="mx-auto mt-5 max-w-72 text-center text-xs leading-relaxed text-stone-400">
          首次抠图需要下载 AI 模型（约 40–80MB），之后会缓存离线使用，请耐心等待
        </p>
      </main>
    </div>
  )
}
