import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CATEGORY_LABEL } from '../db/consts'
import { BlobImg } from '../components/BlobImg'
import { Header } from '../components/Header'
import { toast } from '../components/Toasts'
import { ShirtIcon, TrashIcon } from '../components/icons'

export function OutfitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const outfit = useLiveQuery(() => (id ? db.outfits.get(Number(id)) : undefined), [id])
  const items = useLiveQuery(() => db.items.toArray(), [])
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')

  if (!outfit) {
    return (
      <div className="pb-28">
        <Header title="穿搭详情" back />
        <p className="py-20 text-center text-sm text-stone-400">加载中…</p>
      </div>
    )
  }

  const wornItems = outfit.layers
    .map((l) => items?.find((i) => i.id === l.itemId))
    .filter((i): i is NonNullable<typeof i> => !!i)

  async function handleDelete() {
    if (!confirm('确定删除这套穿搭吗？')) return
    await db.outfits.delete(outfit!.id!)
    toast('已删除')
    navigate('/outfits')
  }

  async function handleRename() {
    const n = name.trim()
    if (!n) return
    await db.outfits.update(outfit!.id!, { name: n })
    setRenaming(false)
    toast('已重命名')
  }

  return (
    <div className="pb-28">
      <Header
        title={outfit.name}
        back
        right={
          <button
            type="button"
            onClick={() => void handleDelete()}
            aria-label="删除"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 active:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        }
      />

      <main className="mx-auto max-w-lg px-4 pt-4">
        <div className="checker mx-auto w-64 overflow-hidden rounded-3xl ring-1 ring-stone-200/70">
          <BlobImg blob={outfit.cover} className="aspect-[4/7] w-full object-cover" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-base font-semibold text-stone-800">{outfit.name}</p>
          <button
            type="button"
            onClick={() => {
              setName(outfit.name)
              setRenaming(true)
            }}
            className="text-xs text-stone-400 underline underline-offset-2"
          >
            重命名
          </button>
        </div>
        <p className="mt-1 text-center text-xs text-stone-400">
          保存于 {new Date(outfit.createdAt).toLocaleDateString('zh-CN')}
        </p>

        <p className="mb-2 mt-6 text-xs font-medium text-stone-400">
          用到的单品（{wornItems.length}）
        </p>
        {wornItems.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-5 text-center text-xs text-stone-400 ring-1 ring-stone-200/70">
            部分单品已被删除
          </p>
        ) : (
          <div className="space-y-2">
            {wornItems.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 ring-1 ring-stone-200/70"
              >
                <div className="checker h-12 w-10 shrink-0 overflow-hidden rounded-lg">
                  <BlobImg
                    blob={it.thumb}
                    cacheKey={`t-${it.id}-${it.updatedAt}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-stone-700">{it.name}</p>
                <p className="text-xs text-stone-400">{CATEGORY_LABEL[it.category]}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/tryon?outfit=${outfit.id}`)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-medium text-white shadow-lg shadow-orange-500/30 active:scale-[0.99]"
        >
          <ShirtIcon className="h-4.5 w-4.5" />
          在试衣间再次搭配
        </button>
      </main>

      {renaming && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/40"
          onClick={() => setRenaming(false)}
        >
          <div
            className="mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-stone-700">重命名穿搭</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-3 w-full rounded-xl bg-stone-50 px-3.5 py-2.5 text-sm ring-1 ring-stone-200 outline-none focus:ring-orange-300"
            />
            <button
              type="button"
              onClick={() => void handleRename()}
              className="mt-4 w-full rounded-full bg-orange-500 py-2.5 text-sm font-medium text-white"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
