import { Link, useLocation } from 'react-router-dom'
import { PlusIcon, ShirtIcon, SparklesIcon, UserIcon, WardrobeIcon } from './icons'
import type { ReactNode } from 'react'

const TABS = [
  { to: '/closet', label: '衣橱', icon: WardrobeIcon },
  { to: '/tryon', label: '试衣间', icon: ShirtIcon },
  null,
  { to: '/outfits', label: '穿搭', icon: SparklesIcon },
  { to: '/settings', label: '我的', icon: UserIcon },
] as const

export function BottomNav() {
  const { pathname } = useLocation()

  const item = (tab: (typeof TABS)[number]): ReactNode => {
    if (!tab) {
      return (
        <Link
          key="add"
          to="/add"
          aria-label="添加衣物"
          className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition active:scale-95"
        >
          <PlusIcon className="h-7 w-7" />
        </Link>
      )
    }
    const active = pathname.startsWith(tab.to)
    const Icon = tab.icon
    return (
      <Link
        key={tab.to}
        to={tab.to}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
          active ? 'text-orange-600' : 'text-stone-400'
        }`}
      >
        <Icon className="h-6 w-6" />
        {tab.label}
      </Link>
    )
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2">
        {TABS.map((t) => item(t))}
      </div>
    </nav>
  )
}
