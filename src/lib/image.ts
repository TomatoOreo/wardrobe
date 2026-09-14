/** 图片解码 / 压缩 / 缩略图等通用处理 */

async function decode(blob: Blob): Promise<{
  draw: CanvasImageSource
  w: number
  h: number
  release: () => void
}> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(blob)
      return { draw: bmp, w: bmp.width, h: bmp.height, release: () => bmp.close() }
    } catch {
      /* fallthrough */
    }
  }
  const url = URL.createObjectURL(blob)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = url
  })
  return { draw: img, w: img.naturalWidth, h: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('画布导出失败'))),
      mime,
      quality,
    )
  })
}

/** 把图片等比缩到最长边 maxSide 并重新编码；返回 [blob, 宽, 高] */
export async function resizeEncode(
  blob: Blob,
  maxSide: number,
  mime: 'image/webp' | 'image/jpeg' | 'image/png',
  quality: number,
): Promise<[Blob, number, number]> {
  const src = await decode(blob)
  try {
    const scale = Math.min(1, maxSide / Math.max(src.w, src.h))
    const w = Math.max(1, Math.round(src.w * scale))
    const h = Math.max(1, Math.round(src.h * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(src.draw, 0, 0, w, h)
    let out = await canvasToBlob(canvas, mime, quality)
    // 个别浏览器不支持目标编码格式时退回 jpeg
    if (out.type !== mime && mime !== 'image/png') {
      out = await canvasToBlob(canvas, 'image/jpeg', 0.86)
    }
    return [out, w, h]
  } finally {
    src.release()
  }
}

/** 存储用原图：最长边 1440 的 webp */
export async function compressOriginal(blob: Blob): Promise<Blob> {
  const [out] = await resizeEncode(blob, 1440, 'image/webp', 0.87)
  return out
}

/** 网格缩略图：最长边 420 */
export async function makeThumb(blob: Blob): Promise<Blob> {
  const [out] = await resizeEncode(blob, 420, 'image/webp', 0.82)
  return out
}

/** 裁掉抠图 PNG 四周的透明边距，让试衣间摆放锚点更准 */
export async function trimTransparent(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const src = document.createElement('canvas')
  src.width = bmp.width
  src.height = bmp.height
  const sctx = src.getContext('2d')!
  sctx.drawImage(bmp, 0, 0)
  const data = sctx.getImageData(0, 0, src.width, src.height).data
  let minX = src.width
  let minY = src.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      if (data[(y * src.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  bmp.close()
  if (maxX < 0) return blob
  const pad = 2
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(src.width - 1, maxX + pad)
  maxY = Math.min(src.height - 1, maxY + pad)
  const out = document.createElement('canvas')
  out.width = maxX - minX + 1
  out.height = maxY - minY + 1
  out.getContext('2d')!.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height)
  return canvasToBlob(out, 'image/png', 1)
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('读取图片失败'))
    r.readAsDataURL(blob)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(0)} GB`
}
