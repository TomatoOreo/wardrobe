import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { SEASON_LABEL } from '../db/consts'
import { BlobImg } from '../components/BlobImg'
import { SparklesIcon } from '../components/icons'

export function Outfits() {
  const outfits = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray(), [])

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-4">
          <h1 className="text-[22px] font-bold text-stone-800">
            穿搭
            {outfits && (
              <span className="ml-2 text-sm font-normal text-stone-400">{outfits.length} 套</span>
            )}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-3 pt-3">
        {outfits === undefined ? (
          <p className="py-20 text-center text-sm text-stone-400">加载中…</p>
        ) : outfits.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-400">
              <SparklesIcon className="h-10 w-10" />
            </div>
            <p className="mt-5 text-base font-medium text-stone-700">还没有保存穿搭</p>
            <p className="mt-1.5 max-w-60 text-sm leading-relaxed text-stone-400">
              去试衣间给虚拟形象搭一套，保存后会生成穿搭封面
            </p>
            <Link
              to="/tryon"
              className="mt-6 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/30 active:scale-95"
            >
              去试衣间
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {outfits.map((o) => (
              <Link
                key={o.id}
                to={`/outfit/${o.id}`}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 transition active:scale-[0.98]"
              >
                <div className="checker aspect-[4/7]">
                  <BlobImg
                    blob={o.cover}
                    cacheKey={`o-${o.id}-${o.createdAt}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-[13px] font-medium text-stone-700">{o.name}</p>
                  <p className="mt-0.5 text-[10px] text-stone-400">
                    {o.seasons.length
                      ? o.seasons.map((s) => SEASON_LABEL[s]).join(' ')
                      : new Date(o.createdAt).toLocaleDateString('zh-CN')}
                    {' · '}
                    {o.layers.length} 件单品
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
