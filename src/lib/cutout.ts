/**
 * 端侧抠图：@imgly/background-removal 在浏览器内运行 isnet 模型。
 * 模型资源自托管在 public/bgr/，由 Service Worker 缓存实现离线可用。
 */

export type CutoutProgress = (phase: string, frac: number) => void

type BgrModule = typeof import('@imgly/background-removal')

let modulePromise: Promise<BgrModule> | null = null

function loadModule(): Promise<BgrModule> {
  modulePromise ??= import('@imgly/background-removal')
  return modulePromise
}

/** 是否是首次运行（模型还未缓存），用于 UI 提示下载体积 */
export async function isModelCached(): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open('bgr-models')
    const keys = await cache.keys()
    return keys.some((r) => r.url.includes('/bgr/'))
  } catch {
    return false
  }
}

/** 清除模型缓存 */
export async function clearModelCache(): Promise<void> {
  if (!('caches' in window)) return
  await caches.delete('bgr-models')
}

/** 模型资源 base（imgly 内部 new URL(name, publicPath) 需要绝对 URL） */
const BGR_PUBLIC_PATH = new URL(`${import.meta.env.BASE_URL}bgr/`, document.baseURI).href

const PHASE_LABEL: Record<string, string> = {
  fetch: '下载模型',
  compute: 'AI 计算中',
}

export async function runCutout(blob: Blob, onProgress?: CutoutProgress): Promise<Blob> {
  const mod = await loadModule()
  return mod.removeBackground(blob, {
    publicPath: BGR_PUBLIC_PATH,
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: (key, current, total) => {
      const phase = key.includes('fetch') ? 'fetch' : 'compute'
      onProgress?.(PHASE_LABEL[phase] ?? phase, total > 0 ? current / total : 0)
    },
  })
}
