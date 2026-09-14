import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ClothingItem } from '../db/db'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  COLORS,
  SEASONS,
  SEASON_LABEL,
  type CategoryOrNone,
  type Season,
} from '../db/consts'
import { BlobImg } from '../components/BlobImg'
import { Header } from '../components/Header'
import { toast } from '../components/Toasts'
import { RefreshIcon, StarIcon, TrashIcon } from '../components/icons'
import { runCutout } from '../lib/cutout'
import { makeThumb, trimTransparent } from '../lib/image'
import { useAddStore } from '../state/addStore'

export function ItemPage() {
  const { id } = useParams()
  const item = useLiveQuery(() => (id ? db.items.get(Number(id)) : undefined), [id])
  const [sp] = useSearchParams()
  const isBatch = sp.get('batch') === '1'
  const processedIds = useAddStore((s) => s.processedIds)

  if (!item) {
    return (
      <div className="pb-28">
        <Header title="衣物详情" back />
        <p className="py-20 text-center text-sm text-stone-400">加载中…</p>
      </div>
    )
  }
  return <ItemForm key={item.id} item={item} batch={isBatch ? processedIds : null} />
}

function ItemForm({ item, batch }: { item: ClothingItem; batch: number[] | null }) {
  const navigate = useNavigate()
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState<CategoryOrNone>(item.category)
  const [colors, setColors] = useState<string[]>(item.colors)
  const [seasons, setSeasons] = useState<Season[]>(item.seasons)
  const [brand, setBrand] = useState(item.brand)
  const [price, setPrice] = useState(item.price == null ? '' : String(item.price))
  const [notes, setNotes] = useState(item.notes)
  const [favorite, setFavorite] = useState(item.favorite === 1)
  const [view, setView] = useState<'cutout' | 'original'>(item.cutout ? 'cutout' : 'original')
  const [recut, setRecut] = useState<{ label: string; frac: number } | null>(null)

  const batchIdx = batch?.indexOf(item.id ?? -1) ?? -1
  const inBatch = batch != null && batchIdx >= 0

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

  async function persist(): Promise<void> {
    await db.items.update(item.id!, {
      name: name.trim() || '未命名',
      category,
      colors,
      seasons,
      brand: brand.trim(),
      price: price === '' ? null : Number(price),
      notes,
      favorite: favorite ? 1 : 0,
      updatedAt: Date.now(),
    })
  }

  async function handleSave() {
    await persist()
    if (inBatch) {
      const next = batch![batchIdx + 1]
      if (next !== undefined) {
        navigate(`/item/${next}?batch=1`, { replace: true })
        return
      }
      useAddStore.getState().clear()
      toast('全部添加完成 🎉')
      navigate('/closet', { replace: true })
    } else {
      toast('已保存')
      navigate('/closet')
    }
  }

  async function handleDelete() {
    if (!confirm('确定删除这件衣物吗？删除后无法恢复。')) return
    await db.items.delete(item.id!)
    toast('已删除')
    navigate(inBatch ? '/closet' : '/closet', { replace: !inBatch })
  }

  async function handleRecut() {
    if (!item.original || recut) return
    setRecut({ label: '准备中', frac: 0 })
    try {
      const raw = await runCutout(item.original, (label, frac) => setRecut({ label, frac }))
      const png = await trimTransparent(raw)
      const thumb = await makeThumb(png)
      await db.items.update(item.id!, { cutout: png, thumb, updatedAt: Date.now() })
      setView('cutout')
      toast('抠图完成')
    } catch (err) {
      console.error(err)
      toast('抠图失败，请重试')
    } finally {
      setRecut(null)
    }
  }

  const shown = view === 'cutout' && item.cutout ? item.cutout : item.original

  return (
    <div className="pb-32">
      <Header
        title={inBatch ? `添加衣物 ${batchIdx + 1}/${batch!.length}` : '衣物详情'}
        back={!inBatch}
      />

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        {inBatch && (
          <div className="rounded-xl bg-orange-50 px-4 py-2.5 text-xs text-orange-700/90">
            填好这件的信息后点「保存并下一件」，继续处理剩下的衣服
          </div>
        )}

        {/* 图片区 */}
        <div className="checker relative mx-auto aspect-[4/5] w-64 overflow-hidden rounded-2xl ring-1 ring-stone-200/70">
          <BlobImg blob={shown} className="h-full w-full object-contain" />

          {item.cutout && item.original && !recut && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {(['cutout', 'original'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1 text-xs backdrop-blur transition ${
                    view === v
                      ? 'bg-stone-800/80 text-white'
                      : 'bg-white/70 text-stone-600'
                  }`}
                >
                  {v === 'cutout' ? '抠图' : '原图'}
                </button>
              ))}
            </div>
          )}

          {recut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
              <RefreshIcon className="h-6 w-6 animate-spin text-orange-500" />
              <p className="text-xs text-stone-600">{recut.label}…</p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${Math.round(recut.frac * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {item.original && (
          <button
            type="button"
            onClick={() => void handleRecut()}
            disabled={!!recut}
            className="mx-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs text-stone-600 ring-1 ring-stone-200 active:bg-stone-100 disabled:opacity-50"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            重新抠图
          </button>
        )}

        {/* 属性区 */}
        <Field label="名称">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：白色oversize衬衫"
            className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
          />
        </Field>

        <Field label="类别">
          <div className="flex flex-wrap gap-1.5">
            {(['uncategorized', ...CATEGORIES] as CategoryOrNone[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-[13px] ring-1 transition ${
                  category === c
                    ? 'bg-orange-500 text-white ring-orange-500'
                    : 'bg-white text-stone-600 ring-stone-200'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="颜色">
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => setColors((a) => toggle(a, c.key))}
                style={{ background: c.hex }}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-1 transition ${
                  colors.includes(c.key) ? 'ring-orange-500' : 'ring-stone-200'
                }`}
              />
            ))}
          </div>
        </Field>

        <Field label="季节">
          <div className="flex gap-1.5">
            {SEASONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeasons((a) => toggle(a, s))}
                className={`h-9 flex-1 rounded-xl text-sm ring-1 transition ${
                  seasons.includes(s)
                    ? 'bg-orange-500 text-white ring-orange-500'
                    : 'bg-white text-stone-600 ring-stone-200'
                }`}
              >
                {SEASON_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3">
          <Field label="品牌" className="flex-1">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="选填"
              className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
            />
          </Field>
          <Field label="价格（元）" className="w-32">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
              inputMode="decimal"
              placeholder="选填"
              className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
            />
          </Field>
        </div>

        <Field label="备注">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="面料、搭配心得…"
            className="w-full resize-none rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
          />
        </Field>

        <button
          type="button"
          onClick={() => setFavorite((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ring-1 transition ${
            favorite
              ? 'bg-amber-50 text-amber-500 ring-amber-200'
              : 'bg-white text-stone-500 ring-stone-200'
          }`}
        >
          <StarIcon filled={favorite} className="h-4 w-4" />
          {favorite ? '已收藏' : '收藏'}
        </button>
      </main>

      {/* 底部操作 */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-stone-50/95 px-4 pb-3 pt-3 backdrop-blur"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={() => void handleDelete()}
            aria-label="删除"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-400 ring-1 ring-stone-200 active:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="h-11 flex-1 rounded-full bg-orange-500 text-sm font-medium text-white shadow-lg shadow-orange-500/30 active:scale-[0.99]"
          >
            {inBatch ? (batchIdx + 1 < batch!.length ? '保存并下一件' : '完成保存') : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-stone-400">{label}</p>
      {children}
    </div>
  )
}
