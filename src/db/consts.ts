export type Category =
  | 'top'
  | 'pants'
  | 'skirt'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'accessory'

export type CategoryOrNone = Category | 'uncategorized'

export const CATEGORIES: Category[] = [
  'top',
  'pants',
  'skirt',
  'dress',
  'outerwear',
  'shoes',
  'bag',
  'accessory',
]

export const CATEGORY_LABEL: Record<CategoryOrNone, string> = {
  top: '上装',
  pants: '裤装',
  skirt: '半裙',
  dress: '连衣裙',
  outerwear: '外套',
  shoes: '鞋履',
  bag: '包袋',
  accessory: '配饰',
  uncategorized: '未分类',
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export const SEASON_LABEL: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

export interface ColorTag {
  key: string
  label: string
  hex: string
}

export const COLORS: ColorTag[] = [
  { key: 'black', label: '黑', hex: '#1c1917' },
  { key: 'white', label: '白', hex: '#f5f5f4' },
  { key: 'gray', label: '灰', hex: '#a8a29e' },
  { key: 'beige', label: '米杏', hex: '#e3d2b8' },
  { key: 'brown', label: '棕', hex: '#8b5e3c' },
  { key: 'red', label: '红', hex: '#dc2626' },
  { key: 'orange', label: '橙', hex: '#f97316' },
  { key: 'yellow', label: '黄', hex: '#eab308' },
  { key: 'green', label: '绿', hex: '#16a34a' },
  { key: 'blue', label: '蓝', hex: '#2563eb' },
  { key: 'denim', label: '牛仔', hex: '#4b6a86' },
  { key: 'purple', label: '紫', hex: '#7c3aed' },
  { key: 'pink', label: '粉', hex: '#ec4899' },
]

export const COLOR_MAP: Record<string, ColorTag> = Object.fromEntries(
  COLORS.map((c) => [c.key, c]),
)

export type ItemSource = 'camera' | 'album' | 'import'

export const SOURCE_LABEL: Record<ItemSource, string> = {
  camera: '拍摄',
  album: '相册',
  import: '导入',
}
