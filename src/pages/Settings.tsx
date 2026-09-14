import { useEffect, useRef, useState } from 'react'
import { db, getSetting, setSetting } from '../db/db'
import { fmtBytes } from '../lib/image'
import { backupFileName, exportBackup, importBackup } from '../lib/backup'
import { clearModelCache, isModelCached, runCutout } from '../lib/cutout'
import { Header } from '../components/Header'
import { toast } from '../components/Toasts'
import { Switch } from './Add'
import { DownloadIcon, RefreshIcon, UploadIcon } from '../components/icons'

export function Settings() {
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null)
  const [counts, setCounts] = useState({ items: 0, outfits: 0 })
  const [auto, setAuto] = useState(true)
  const [modelCached, setModelCached] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setAuto(await getSetting('autoCutout', true))
    setModelCached(await isModelCached())
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      setUsage({ usage: e.usage ?? 0, quota: e.quota ?? 0 })
    }
    setCounts({ items: await db.items.count(), outfits: await db.outfits.count() })
  }

  async function handleExport() {
    setBusy('export')
    try {
      const zip = await exportBackup()
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = backupFileName()
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      toast('备份已导出')
    } catch (err) {
      console.error(err)
      toast('导出失败，请重试')
    } finally {
      setBusy(null)
    }
  }

  async function handleImport(file: File) {
    setBusy('import')
    try {
      const r = await importBackup(file)
      toast(`已导入 ${r.items} 件衣物、${r.outfits} 套穿搭`)
      await refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : '导入失败')
    } finally {
      setBusy(null)
    }
  }

  async function handlePreloadModel() {
    setBusy('model')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 64, 64)
      const tiny = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png'),
      )
      await runCutout(tiny)
      await refresh()
      toast('模型已就绪，可离线抠图')
    } catch (err) {
      console.error(err)
      toast('模型下载失败，请检查网络')
    } finally {
      setBusy(null)
    }
  }

  async function handleClearModel() {
    if (!confirm('确定清除抠图模型缓存吗？下次抠图需要重新下载。')) return
    await clearModelCache()
    await refresh()
    toast('已清除模型缓存')
  }

  return (
    <div className="pb-28">
      <Header title="我的" />

      <main className="mx-auto max-w-lg space-y-3 px-4 pt-4">
        <Section title="备份与恢复">
          <p className="text-xs leading-relaxed text-stone-400">
            所有数据仅保存在本设备浏览器中。换手机或清理浏览器前，请先导出备份 zip；
            在新设备上选择导入即可恢复。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={busy === 'export'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-orange-500 py-2.5 text-sm font-medium text-white active:scale-[0.99] disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              {busy === 'export' ? '导出中…' : '导出备份'}
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              disabled={busy === 'import'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm text-stone-600 ring-1 ring-stone-200 active:bg-stone-100 disabled:opacity-50"
            >
              <UploadIcon className="h-4 w-4" />
              {busy === 'import' ? '导入中…' : '导入备份'}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImport(f)
                e.target.value = ''
              }}
            />
          </div>
        </Section>

        <Section title="数据">
          <div className="space-y-2 text-sm text-stone-600">
            <p className="flex justify-between">
              <span>衣物</span>
              <span className="text-stone-800">{counts.items} 件</span>
            </p>
            <p className="flex justify-between">
              <span>穿搭</span>
              <span className="text-stone-800">{counts.outfits} 套</span>
            </p>
            {usage && (
              <>
                <p className="flex justify-between">
                  <span>已用空间</span>
                  <span className="text-stone-800">
                    {fmtBytes(usage.usage)}
                    {usage.quota > 0 && ` / 约 ${fmtBytes(usage.quota)}`}
                  </span>
                </p>
                {usage.quota > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${Math.min(100, (usage.usage / usage.quota) * 100)}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Section>

        <Section title="抠图">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-700">添加时自动抠图</p>
              <p className="mt-0.5 text-xs text-stone-400">关闭后仅在详情页手动抠图</p>
            </div>
            <Switch
              checked={auto}
              onChange={(v) => {
                setAuto(v)
                void setSetting('autoCutout', v)
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <div>
              <p className="text-sm text-stone-700">抠图模型</p>
              <p className="mt-0.5 text-xs text-stone-400">
                {modelCached ? '已缓存，可离线使用' : '未缓存，首次使用需联网下载'}
              </p>
            </div>
            <div className="flex gap-2">
              {!modelCached && (
                <button
                  type="button"
                  onClick={() => void handlePreloadModel()}
                  disabled={busy === 'model'}
                  className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs text-orange-600 disabled:opacity-50"
                >
                  <RefreshIcon className={`h-3.5 w-3.5 ${busy === 'model' ? 'animate-spin' : ''}`} />
                  {busy === 'model' ? '下载中…' : '预下载'}
                </button>
              )}
              {modelCached && (
                <button
                  type="button"
                  onClick={() => void handleClearModel()}
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-500"
                >
                  清除缓存
                </button>
              )}
            </div>
          </div>
        </Section>

        <Section title="使用说明">
          <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-stone-400">
            <li>建议用 Safari / Chrome 的「添加到主屏幕」安装使用，体验最佳且数据不会被清理</li>
            <li>iPhone 不支持直接分享图片到本应用：先存相册，再从「从相册选择」导入</li>
            <li>衣服照片平铺、挂拍或正面照的抠图效果最好</li>
            <li>试衣间里拖动衣服可调整位置，保存搭配后会记住摆放</li>
          </ul>
        </Section>

        <p className="pt-2 text-center text-[11px] text-stone-300">我的电子衣橱 · v1.0</p>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200/70">
      <h2 className="mb-2 text-sm font-semibold text-stone-800">{title}</h2>
      {children}
    </section>
  )
}
