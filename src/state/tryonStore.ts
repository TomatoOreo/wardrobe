import { create } from 'zustand'
import type { AvatarConfig, ClothingItem, Outfit, Placement } from '../db/db'
import { db, saveAvatar } from '../db/db'
import type { Category } from '../db/consts'
import { LAYER_Z, defaultPlacement } from '../lib/placement'
import { toast } from '../components/Toasts'

export interface TryOnLayer {
  itemId: number
  cat: Category
  placement: Placement
  /** 高/宽比，用于由 w 计算显示高度 */
  aspect: number
}

/** 类别之间的互斥关系：穿连衣裙时脱掉上下装，反之亦然 */
const CONFLICTS: Partial<Record<Category, Category[]>> = {
  dress: ['top', 'pants', 'skirt', 'dress'],
  top: ['dress'],
  pants: ['dress'],
  skirt: ['dress'],
}

interface TryOnState {
  avatar: AvatarConfig
  layers: TryOnLayer[]
  selected: number | null
  init: (config: AvatarConfig) => void
  setAvatar: (patch: Partial<AvatarConfig>) => void
  toggleItem: (item: ClothingItem) => Promise<void>
  select: (itemId: number | null) => void
  updatePlacement: (itemId: number, patch: Partial<Placement>) => void
  reset: () => void
  loadOutfit: (outfit: Outfit) => Promise<void>
}

async function aspectOf(blob: Blob): Promise<number> {
  const bmp = await createImageBitmap(blob)
  const a = bmp.height / bmp.width
  bmp.close()
  return a
}

export const useTryOn = create<TryOnState>((set, get) => ({
  avatar: { skin: '#f7d0be', hair: 'long', hairColor: '#3f3229' },
  layers: [],
  selected: null,

  init: (config) => set({ avatar: config }),

  setAvatar: (patch) => {
    const next = { ...get().avatar, ...patch }
    set({ avatar: next })
    void saveAvatar(next)
  },

  toggleItem: async (item) => {
    const { layers } = get()
    if (item.id === undefined) return
    const existing = layers.find((l) => l.itemId === item.id)
    if (existing) {
      set((s) => ({
        layers: s.layers.filter((l) => l.itemId !== item.id),
        selected: s.selected === item.id ? null : s.selected,
      }))
      return
    }
    if (item.category === 'uncategorized') {
      toast('请先在衣物详情里设置类别，再用来搭配')
      return
    }
    if (!item.cutout) {
      toast('这件还没有抠图，去详情页重新生成吧')
      return
    }
    const cat = item.category as Category
    const conflicts = CONFLICTS[cat] ?? []
    const kept = layers.filter((l) => !conflicts.includes(l.cat))
    const aspect = await aspectOf(item.cutout)
    const placement = item.placement ?? defaultPlacement(cat, 1, aspect)
    set({
      layers: [...kept, { itemId: item.id!, cat, placement, aspect }],
      selected: item.id!,
    })
  },

  select: (itemId) => set({ selected: itemId }),

  updatePlacement: (itemId, patch) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.itemId === itemId ? { ...l, placement: { ...l.placement, ...patch } } : l,
      ),
    })),

  reset: () => set({ layers: [], selected: null }),

  loadOutfit: async (outfit) => {
    const items = await db.items.bulkGet(outfit.layers.map((l) => l.itemId))
    const layers: TryOnLayer[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const l = outfit.layers[i]
      if (!item?.cutout || item.category === 'uncategorized') continue
      layers.push({
        itemId: item.id!,
        cat: item.category as Category,
        placement: l.placement,
        aspect: await aspectOf(item.cutout),
      })
    }
    set({ avatar: outfit.avatar, layers, selected: null })
    void saveAvatar(outfit.avatar)
  },
}))

export function sortedLayers(layers: TryOnLayer[]): TryOnLayer[] {
  return [...layers].sort((a, b) => LAYER_Z[a.cat] - LAYER_Z[b.cat])
}
