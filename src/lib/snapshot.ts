import { avatarSVG } from '../avatar/avatarSVG'
import type { AvatarConfig, Placement } from '../db/db'
import { blobToDataURL, loadImage } from './image'

/** 把形象 + 衣物图层渲染成穿搭封面 PNG（2x 舞台尺寸） */
export async function renderOutfitCover(
  avatar: AvatarConfig,
  layers: { cutout: Blob; placement: Placement }[],
): Promise<Blob | null> {
  const S = 2
  const canvas = document.createElement('canvas')
  canvas.width = 400 * S
  canvas.height = 700 * S
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const svg = avatarSVG(avatar).replace(
    'width="100%" height="100%"',
    `width="${400 * S}" height="${700 * S}"`,
  )
  const avatarImg = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg))
  ctx.drawImage(avatarImg, 0, 0)

  for (const l of layers) {
    const img = await loadImage(await blobToDataURL(l.cutout))
    const w = l.placement.w * S
    const h = w * (img.naturalHeight / img.naturalWidth)
    ctx.save()
    ctx.translate(l.placement.cx * S, l.placement.cy * S)
    ctx.rotate((l.placement.rot * Math.PI) / 180)
    ctx.scale(l.placement.flip ? -1 : 1, 1)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()
  }

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
}
