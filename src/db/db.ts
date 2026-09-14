import Dexie, { type EntityTable } from 'dexie'
import type { CategoryOrNone, ItemSource, Season } from './consts'

export interface Placement {
  /** 中心点 x（舞台坐标，舞台为 400x700） */
  cx: number
  /** 中心点 y */
  cy: number
  /** 显示宽度（舞台坐标单位） */
  w: number
  /** 旋转角度（度） */
  rot: number
  /** 水平镜像 */
  flip: boolean
}

export interface ClothingItem {
  id?: number
  name: string
  category: CategoryOrNone
  colors: string[]
  seasons: Season[]
  brand: string
  price: number | null
  notes: string
  /** 原始照片（压缩后） */
  original: Blob | null
  /** 抠图结果 PNG（透明背景），null 表示尚未抠图 */
  cutout: Blob | null
  thumb: Blob
  source: ItemSource
  favorite: 0 | 1
  wearCount: number
  /** 试衣间里针对默认形象的摆放参数 */
  placement: Placement | null
  createdAt: number
  updatedAt: number
}

export interface OutfitLayer {
  itemId: number
  placement: Placement
}

export interface AvatarConfig {
  skin: string
  hair: string
  hairColor: string
}

export interface Outfit {
  id?: number
  name: string
  avatar: AvatarConfig
  layers: OutfitLayer[]
  cover: Blob | null
  seasons: Season[]
  notes: string
  createdAt: number
}

export interface AvatarRecord {
  id?: number
  name: string
  config: AvatarConfig
}

export interface SettingRecord {
  key: string
  value: unknown
}

type DB = {
  items: EntityTable<ClothingItem, 'id'>
  outfits: EntityTable<Outfit, 'id'>
  avatars: EntityTable<AvatarRecord, 'id'>
  settings: EntityTable<SettingRecord, 'key'>
}

export const db = new Dexie('wardrobe') as Dexie & DB

db.version(1).stores({
  items: '++id, category, favorite, createdAt, *colors, *seasons',
  outfits: '++id, createdAt',
  avatars: '++id, name',
  settings: 'key',
})

/* ---------- settings 快捷读写 ---------- */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  return row === undefined ? fallback : (row.value as T)
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: '#f7d5c4',
  hair: 'long',
  hairColor: '#3f3229',
}

/** 获取默认形象配置（没有则创建） */
export async function ensureAvatar(): Promise<AvatarConfig> {
  const row = await db.avatars.get(1)
  if (row) return row.config
  const record: AvatarRecord = { id: 1, name: '我的形象', config: DEFAULT_AVATAR }
  await db.avatars.put(record)
  return record.config
}

export async function saveAvatar(config: AvatarConfig): Promise<void> {
  const row = await db.avatars.get(1)
  await db.avatars.put({ id: 1, name: row?.name ?? '我的形象', config })
}
