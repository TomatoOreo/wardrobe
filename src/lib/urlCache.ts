/** 衣物缩略图 object URL 缓存：避免列表刷新时反复 create/revoke */
const urlCache = new Map<string, string>()
const blobCache = new Map<string, Blob>()
const MAX_CACHE = 400

export function cachedThumbURL(key: string, blob: Blob): string {
  const hit = urlCache.get(key)
  if (hit) return hit
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  blobCache.set(key, blob)
  if (urlCache.size > MAX_CACHE) {
    const oldest = urlCache.keys().next().value as string | undefined
    if (oldest !== undefined) {
      URL.revokeObjectURL(urlCache.get(oldest)!)
      urlCache.delete(oldest)
      blobCache.delete(oldest)
    }
  }
  return url
}
