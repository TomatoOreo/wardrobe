/**
 * 备份导出 / 导入：zip（manifest.json + images/）
 * 导入采用"合并"策略：所有记录以新 id 写入，不会覆盖现有数据。
 */
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import { db, DEFAULT_AVATAR } from '../db/db'
import type { ClothingItem, Outfit } from '../db/db'

interface BackupManifest {
  app: 'wardrobe'
  version: 1
  exportedAt: number
  avatar: { skin: string; hair: string; hairColor: string } | null
  items: Omit<ClothingItem, 'original' | 'cutout' | 'thumb'>[]
  outfits: Omit<Outfit, 'cover'>[]
}

export async function exportBackup(): Promise<Blob> {
  const [items, outfits, avatarRows] = await Promise.all([
    db.items.toArray(),
    db.outfits.toArray(),
    db.avatars.toArray(),
  ])

  const files: Record<string, Uint8Array> = {}
  const itemMetas: BackupManifest['items'] = []

  for (const it of items) {
    const { original, cutout, thumb, ...meta } = it
    const dir = `images/items/${it.id}`
    if (thumb) files[`${dir}/thumb.webp`] = new Uint8Array(await thumb.arrayBuffer())
    if (cutout) files[`${dir}/cutout.png`] = new Uint8Array(await cutout.arrayBuffer())
    if (original) {
      const ext = original.type.includes('png') ? 'png' : 'webp'
      files[`${dir}/original.${ext}`] = new Uint8Array(await original.arrayBuffer())
    }
    itemMetas.push({ ...meta })
  }

  const outfitMetas: BackupManifest['outfits'] = []
  for (const o of outfits) {
    const { cover, ...meta } = o
    if (cover) files[`images/outfits/${o.id}/cover.png`] = new Uint8Array(await cover.arrayBuffer())
    outfitMetas.push({ ...meta })
  }

  const manifest: BackupManifest = {
    app: 'wardrobe',
    version: 1,
    exportedAt: Date.now(),
    avatar: avatarRows[0]?.config ?? DEFAULT_AVATAR,
    items: itemMetas,
    outfits: outfitMetas,
  }
  files['manifest.json'] = strToU8(JSON.stringify(manifest))

  const zipped = zipSync(files, { level: 0 }) // 图片已压缩，不再压缩以加快速度
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

export function backupFileName(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `衣橱备份-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.zip`
}

export interface ImportResult {
  items: number
  outfits: number
}

export async function importBackup(file: Blob): Promise<ImportResult> {
  const buf = new Uint8Array(await file.arrayBuffer())
  let entries: Record<string, Uint8Array>
  let manifest: BackupManifest
  try {
    entries = unzipSync(buf)
    manifest = JSON.parse(strFromU8(entries['manifest.json'])) as BackupManifest
  } catch {
    throw new Error('无法读取备份文件，请确认选择的是本应用导出的 zip')
  }
  if (manifest?.app !== 'wardrobe') throw new Error('这不是本应用导出的备份文件')

  const now = Date.now()
  /** 备份里的旧衣物 id → 导入后的新 id，用于重映射穿搭图层 */
  const idMap = new Map<number, number>()
  for (const meta of manifest.items) {
    const dir = `images/items/${meta.id}`
    const thumb = entries[`${dir}/thumb.webp`]
    if (!thumb) continue
    const item: ClothingItem = {
      ...meta,
      id: undefined,
      colors: meta.colors ?? [],
      seasons: meta.seasons ?? [],
      brand: meta.brand ?? '',
      price: meta.price ?? null,
      notes: meta.notes ?? '',
      favorite: meta.favorite === 1 ? 1 : 0,
      wearCount: meta.wearCount ?? 0,
      thumb: new Blob([thumb as BlobPart], { type: 'image/webp' }),
      cutout: entries[`${dir}/cutout.png`]
        ? new Blob([entries[`${dir}/cutout.png`] as BlobPart], { type: 'image/png' })
        : null,
      original: entries[`${dir}/original.webp`]
        ? new Blob([entries[`${dir}/original.webp`] as BlobPart], { type: 'image/webp' })
        : null,
      createdAt: meta.createdAt ?? now,
      updatedAt: now,
    }
    const newId = await db.items.add(item)
    if (meta.id != null) idMap.set(meta.id, Number(newId))
  }

  for (const meta of manifest.outfits) {
    const coverFile = entries[`images/outfits/${meta.id}/cover.png`]
    const layers = (meta.layers ?? [])
      .map((l) => ({ ...l, itemId: idMap.get(l.itemId) ?? l.itemId }))
      .filter((l) => idMap.has(l.itemId))
    const outfit: Outfit = {
      ...meta,
      id: undefined,
      layers,
      seasons: meta.seasons ?? [],
      notes: meta.notes ?? '',
      cover: coverFile
        ? new Blob([coverFile as BlobPart], { type: 'image/png' })
        : null,
      createdAt: meta.createdAt ?? now,
    }
    await db.outfits.add(outfit)
  }

  if (manifest.avatar) {
    const row = await db.avatars.get(1)
    await db.avatars.put({ id: 1, name: row?.name ?? '我的形象', config: manifest.avatar })
  }

  return { items: manifest.items.length, outfits: manifest.outfits.length }
}
