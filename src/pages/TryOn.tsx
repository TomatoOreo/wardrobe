import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Placement } from '../db/db'
import type { TryOnLayer } from '../state/tryonStore'
import { sortedLayers, useTryOn } from '../state/tryonStore'
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../db/consts'
import { STAGE } from '../lib/placement'
import { renderOutfitCover } from '../lib/snapshot'
import { AvatarBody } from '../avatar/AvatarBody'
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../avatar/avatarSVG'
import { BlobImg } from '../components/BlobImg'
import { toast } from '../components/Toasts'
import { FlipIcon, TrashIcon, UserRoundIcon } from '../components/icons'

export function TryOn() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const avatar = useTryOn((s) => s.avatar)
  const layers = useTryOn((s) => s.layers)
  const selected = useTryOn((s) => s.selected)
  const items = useLiveQuery(() => db.items.toArray(), [])

  const [cat, setCat] = useState<Category>('top')
  const [showAvatarSheet, setShowAvatarSheet] = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [outfitName, setOutfitName] = useState('')
  const [saving, setSaving] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setK(el.clientWidth / STAGE.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const outfitLoaded = useRef<number | null>(null)
  useEffect(() => {
    const raw = sp.get('outfit')
    if (!raw) return
    const oid = Number(raw)
    if (Number.isNaN(oid) || outfitLoaded.current === oid) return
    outfitLoaded.current = oid
    void db.outfits.get(oid).then((o) => {
      if (o) void useTryOn.getState().loadOutfit(o)
    })
  }, [sp])

  const sorted = sortedLayers(layers)
  const selectedLayer = layers.find((l) => l.itemId === selected)
  const catItems = (items ?? []).filter((i) => i.category === cat)

  async function handleSave() {
    setShowSaveSheet(false)
    if (!layers.length || saving) return
    setSaving(true)
    try {
      const entries = await Promise.all(
        layers.map(async (l) => ({ l, item: await db.items.get(l.itemId) })),
      )
      const coverLayers = entries
        .filter((e) => e.item?.cutout)
        .map((e) => ({ cutout: e.item!.cutout!, placement: e.l.placement }))
      const cover = await renderOutfitCover(avatar, coverLayers)
      for (const e of entries) {
        if (e.item) await db.items.update(e.item.id!, { placement: e.l.placement })
      }
      const id = await db.outfits.add({
        name: outfitName.trim() || '新穿搭',
        avatar,
        layers: layers.map(({ itemId, placement }) => ({ itemId, placement })),
        cover,
        seasons: [],
        notes: '',
        createdAt: Date.now(),
      })
      toast('穿搭已保存')
      setOutfitName('')
      useTryOn.getState().reset()
      navigate(`/outfit/${id}`)
    } catch (err) {
      console.error(err)
      toast('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-13 max-w-lg items-center justify-between px-4">
          <h1 className="text-[17px] font-semibold text-stone-800">试衣间</h1>
          {layers.length > 0 && (
            <button
              type="button"
              onClick={() => useTryOn.getState().reset()}
              className="text-xs text-stone-400 underline underline-offset-2"
            >
              全部脱下
            </button>
          )}
        </div>
      </header>

      {/* 舞台 */}
      <main className="mx-auto max-w-lg px-4 pt-3">
        <div
          ref={wrapRef}
          className="relative mx-auto w-full ring-1 ring-stone-200/70"
          style={{
            aspectRatio: `${STAGE.w} / ${STAGE.h}`,
            maxWidth: 'min(340px, calc((100dvh - 385px) * 400 / 700))',
            borderRadius: 24,
          }}
          onPointerDown={() => useTryOn.getState().select(null)}
        >
          <div
            className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white"
            style={{
              width: STAGE.w,
              height: STAGE.h,
              transform: `scale(${k})`,
              borderRadius: 24,
            }}
          >
            <AvatarBody config={avatar} className="absolute inset-0" />
            {sorted.map((l) => (
              <LayerView
                key={l.itemId}
                layer={l}
                k={k}
                selected={l.itemId === selected}
                onSelect={() => useTryOn.getState().select(l.itemId)}
              />
            ))}
          </div>
        </div>

        {/* 选中衣物调整 */}
        {selectedLayer ? (
          <div className="mt-3 space-y-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200/70">
            <div className="flex items-center gap-3">
              <span className="w-7 text-xs text-stone-400">大小</span>
              <input
                type="range"
                min={30}
                max={320}
                value={Math.round(selectedLayer.placement.w)}
                onChange={(e) =>
                  useTryOn.getState().updatePlacement(selectedLayer.itemId, {
                    w: Number(e.target.value),
                  })
                }
                className="flex-1 accent-orange-500"
              />
              <button
                type="button"
                aria-label="水平翻转"
                onClick={() =>
                  useTryOn.getState().updatePlacement(selectedLayer.itemId, {
                    flip: !selectedLayer.placement.flip,
                  })
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${
                  selectedLayer.placement.flip
                    ? 'bg-orange-500 text-white ring-orange-500'
                    : 'bg-white text-stone-500 ring-stone-200'
                }`}
              >
                <FlipIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="脱下"
                onClick={() => {
                  const item = catItems.find((i) => i.id === selectedLayer.itemId)
                  if (item) void useTryOn.getState().toggleItem(item)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-400 ring-1 ring-stone-200 active:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 text-xs text-stone-400">旋转</span>
              <input
                type="range"
                min={-45}
                max={45}
                value={Math.round(selectedLayer.placement.rot)}
                onChange={(e) =>
                  useTryOn.getState().updatePlacement(selectedLayer.itemId, {
                    rot: Number(e.target.value),
                  })
                }
                className="flex-1 accent-orange-500"
              />
              <span className="w-8" />
              <span className="w-8" />
            </div>
            <p className="text-center text-[11px] text-stone-300">拖动衣服调整位置</p>
          </div>
        ) : (
          <p className="mt-3 text-center text-xs text-stone-400">
            点击下方衣服给形象穿上 · 点衣服可再选中微调
          </p>
        )}

        {/* 衣柜选择 */}
        <div className="mt-3 rounded-2xl bg-white ring-1 ring-stone-200/70">
          <div className="no-scrollbar flex gap-1 overflow-x-auto px-2 pt-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition ${
                  cat === c ? 'bg-orange-500 text-white' : 'text-stone-500'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
            {catItems.length === 0 && (
              <p className="py-3 text-xs text-stone-400">这个分类还没有衣服，先去添加吧</p>
            )}
            {catItems.map((it) => {
              const on = layers.some((l) => l.itemId === it.id)
              return (
                <button
                  key={it.id}
                  type="button"
                  title={it.name}
                  onClick={() => void useTryOn.getState().toggleItem(it)}
                  className={`checker h-16 w-14 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                    on ? 'ring-orange-500' : 'ring-stone-200'
                  }`}
                >
                  <BlobImg
                    blob={it.thumb}
                    cacheKey={`t-${it.id}-${it.updatedAt}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* 操作行 */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowAvatarSheet(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm text-stone-600 ring-1 ring-stone-200 active:bg-stone-100"
          >
            <UserRoundIcon className="h-4.5 w-4.5" />
            形象
          </button>
          <button
            type="button"
            onClick={() => setShowSaveSheet(true)}
            disabled={!layers.length}
            className="flex-[2] rounded-full bg-orange-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/30 active:scale-[0.99] disabled:opacity-40"
          >
            保存这身搭配
          </button>
        </div>
      </main>

      {/* 形象设置 */}
      {showAvatarSheet && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/40"
          onClick={() => setShowAvatarSheet(false)}
        >
          <div
            className="mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-stone-200" />
            <p className="mt-4 text-sm font-semibold text-stone-700">肤色</p>
            <div className="mt-2 flex gap-2.5">
              {SKIN_TONES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => useTryOn.getState().setAvatar({ skin: hex })}
                  style={{ background: hex }}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                    avatar.skin === hex ? 'ring-orange-500' : 'ring-transparent'
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-stone-700">发型</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h.key}
                  type="button"
                  onClick={() => useTryOn.getState().setAvatar({ hair: h.key })}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] ring-1 transition ${
                    avatar.hair === h.key
                      ? 'bg-orange-500 text-white ring-orange-500'
                      : 'bg-white text-stone-600 ring-stone-200'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-stone-700">发色</p>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {HAIR_COLORS.map((h) => (
                <button
                  key={h.key}
                  type="button"
                  title={h.label}
                  onClick={() => useTryOn.getState().setAvatar({ hairColor: h.key })}
                  style={{ background: h.key }}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                    avatar.hairColor === h.key ? 'ring-orange-500' : 'ring-transparent'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarSheet(false)}
              className="mt-6 w-full rounded-full bg-orange-500 py-2.5 text-sm font-medium text-white"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {/* 保存穿搭 */}
      {showSaveSheet && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/40"
          onClick={() => setShowSaveSheet(false)}
        >
          <div
            className="mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-stone-200" />
            <p className="mt-4 text-sm font-semibold text-stone-700">给这身搭配起个名字</p>
            <input
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              placeholder="例如：周末逛街look"
              autoFocus
              className="mt-2 w-full rounded-xl bg-stone-50 px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="mt-4 w-full rounded-full bg-orange-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? '正在生成封面…' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LayerView({
  layer,
  k,
  selected,
  onSelect,
}: {
  layer: TryOnLayer
  k: number
  selected: boolean
  onSelect: () => void
}) {
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
  const p: Placement = layer.placement
  const h = p.w * layer.aspect

  return (
    <div
      style={{
        position: 'absolute',
        left: p.cx - p.w / 2,
        top: p.cy - h / 2,
        width: p.w,
        height: h,
        transform: `rotate(${p.rot}deg) scaleX(${p.flip ? -1 : 1})`,
        touchAction: 'none',
        cursor: 'move',
        borderRadius: 6,
        outline: selected ? '3px solid #fb923c' : 'none',
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, y: e.clientY, cx: p.cx, cy: p.cy }
        onSelect()
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const dx = (e.clientX - drag.current.x) / k
        const dy = (e.clientY - drag.current.y) / k
        useTryOn.getState().updatePlacement(layer.itemId, {
          cx: drag.current.cx + dx,
          cy: drag.current.cy + dy,
        })
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <LayerImage itemId={layer.itemId} />
    </div>
  )
}

function LayerImage({ itemId }: { itemId: number }) {
  const item = useLiveQuery(() => db.items.get(itemId), [itemId])
  if (!item?.cutout) return null
  return <BlobImg blob={item.cutout} className="pointer-events-none h-full w-full object-fill" />
}
