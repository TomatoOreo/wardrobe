import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
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
import { SearchIcon, StarIcon, WardrobeIcon } from '../components/icons'

export function Closet() {
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray(), [])

  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | CategoryOrNone>('all')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [favOnly, setFavOnly] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const filterActive = seasons.length > 0 || colors.length > 0 || favOnly

  const filtered = useMemo(() => {
    let list = items ?? []
    if (cat !== 'all') list = list.filter((i) => i.category === cat)
    if (seasons.length) list = list.filter((i) => seasons.some((s) => i.seasons.includes(s)))
    if (colors.length) list = list.filter((i) => colors.some((c) => i.colors.includes(c)))
    if (favOnly) list = list.filter((i) => i.favorite === 1)
    const kw = q.trim().toLowerCase()
    if (kw) list = list.filter((i) => `${i.name} ${i.brand} ${i.notes}`.toLowerCase().includes(kw))
    return list
  }, [items, cat, seasons, colors, favOnly, q])

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 pt-4">
          <div className="flex items-end justify-between">
            <h1 className="text-[22px] font-bold text-stone-800">
              我的衣橱
              {items && <span className="ml-2 text-sm font-normal text-stone-400">{items.length} 件</span>}
            </h1>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-stone-200 focus-within:ring-orange-300">
              <SearchIcon className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索名称 / 品牌"
                className="w-full bg-transparent text-sm outline-none placeholder:text-stone-300"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilter((s) => !s)}
              className={`flex h-9 items-center gap-1 rounded-full px-3 text-sm ring-1 transition ${
                showFilter || filterActive
                  ? 'bg-orange-50 text-orange-600 ring-orange-200'
                  : 'bg-white text-stone-500 ring-stone-200'
              }`}
            >
              筛选
              {filterActive && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
            </button>
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-3">
            <Chip active={cat === 'all'} onClick={() => setCat('all')}>
              全部
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? 'all' : c)}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
          {showFilter && (
            <div className="space-y-2.5 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-9 text-xs text-stone-400">季节</span>
                {SEASONS.map((s) => (
                  <Chip key={s} small active={seasons.includes(s)} onClick={() => setSeasons((a) => toggle(a, s))}>
                    {SEASON_LABEL[s]}
                  </Chip>
                ))}
                <Chip small active={favOnly} onClick={() => setFavOnly((v) => !v)}>
                  ♥ 收藏
                </Chip>
                {filterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeasons([])
                      setColors([])
                      setFavOnly(false)
                    }}
                    className="ml-1 text-xs text-stone-400 underline underline-offset-2"
                  >
                    清空
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-9 text-xs text-stone-400">颜色</span>
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    title={c.label}
                    onClick={() => setColors((a) => toggle(a, c.key))}
                    style={{ background: c.hex }}
                    className={`h-6 w-6 rounded-full ring-2 ring-offset-1 transition ${
                      colors.includes(c.key) ? 'ring-orange-500' : 'ring-stone-200'
                    } ${c.key === 'white' ? 'shadow-inner' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-3 pt-3">
        {items === undefined ? (
          <p className="py-20 text-center text-sm text-stone-400">加载中…</p>
        ) : filtered.length === 0 ? (
          items.length === 0 ? (
            <EmptyCloset />
          ) : (
            <p className="py-20 text-center text-sm text-stone-400">没有符合筛选的衣服</p>
          )
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((it) => (
              <Link
                key={it.id}
                to={`/item/${it.id}`}
                className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 transition active:scale-[0.98]"
              >
                <div className="checker aspect-[3/4]">
                  <BlobImg
                    blob={it.thumb}
                    cacheKey={`t-${it.id}-${it.updatedAt}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-stone-700">{it.name || '未命名'}</p>
                  <p className="text-[10px] text-stone-400">{CATEGORY_LABEL[it.category]}</p>
                </div>
                {it.favorite === 1 && (
                  <StarIcon
                    filled
                    className="absolute right-1.5 top-1.5 h-4 w-4 text-amber-400 drop-shadow"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Chip({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean
  onClick: () => void
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full ring-1 transition ${
        small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'
      } ${
        active
          ? 'bg-orange-500 text-white ring-orange-500'
          : 'bg-white text-stone-600 ring-stone-200'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyCloset() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-400">
        <WardrobeIcon className="h-10 w-10" />
      </div>
      <p className="mt-5 text-base font-medium text-stone-700">衣橱还是空的</p>
      <p className="mt-1.5 max-w-60 text-sm leading-relaxed text-stone-400">
        拍照或上传衣服照片，AI 会自动抠图并帮你分类记录
      </p>
      <Link
        to="/add"
        className="mt-6 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/30 active:scale-95"
      >
        添加第一件衣物
      </Link>
    </div>
  )
}
