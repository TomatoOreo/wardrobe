import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Toasts } from './components/Toasts'
import { ensureAvatar } from './db/db'
import { useTryOn } from './state/tryonStore'
import { Closet } from './pages/Closet'
import { Add } from './pages/Add'
import { Camera } from './pages/Camera'
import { Processing } from './pages/Processing'
import { ItemPage } from './pages/Item'
import { TryOn } from './pages/TryOn'
import { Outfits } from './pages/Outfits'
import { OutfitDetail } from './pages/OutfitDetail'
import { Settings } from './pages/Settings'

function Shell() {
  const { pathname } = useLocation()
  const hideNav =
    pathname.startsWith('/camera') ||
    pathname.startsWith('/processing') ||
    /^\/item\/\d+/.test(pathname)

  useEffect(() => {
    void ensureAvatar().then((config) => useTryOn.getState().init(config))
  }, [])

  return (
    <div className="min-h-full bg-stone-100/60">
      <div className="relative mx-auto min-h-full max-w-lg bg-stone-50 shadow-black/[0.03]">
        <Routes>
          <Route path="/" element={<Navigate to="/closet" replace />} />
          <Route path="/closet" element={<Closet />} />
          <Route path="/add" element={<Add />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/tryon" element={<TryOn />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/outfit/:id" element={<OutfitDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
        {!hideNav && <BottomNav />}
        <Toasts />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
