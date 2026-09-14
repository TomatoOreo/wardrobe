import { useEffect, useState } from 'react'
import { cachedThumbURL } from '../lib/urlCache'

interface Props {
  blob: Blob | null | undefined
  /** 提供时使用全局缓存（用于列表），否则组件卸载时释放 URL */
  cacheKey?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

export function BlobImg({ blob, cacheKey, alt = '', className, style }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    if (cacheKey) {
      setUrl(cachedThumbURL(cacheKey, blob))
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob, cacheKey])

  if (!url) return null
  return <img src={url} alt={alt} className={className} style={style} draggable={false} />
}
