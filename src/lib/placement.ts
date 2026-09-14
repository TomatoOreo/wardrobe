import type { Category } from '../db/consts'
import type { Placement } from '../db/db'

/** 试衣间舞台逻辑尺寸（渲染时整体缩放适配屏幕） */
export const STAGE = { w: 400, h: 700 }

/** 各类别的默认摆放锚点（相对舞台坐标） */
export interface Anchor {
  cx: number
  cy: number
  maxW: number
  maxH: number
}

export const ANCHORS: Record<Category, Anchor> = {
  top: { cx: 200, cy: 292, maxW: 165, maxH: 150 },
  outerwear: { cx: 200, cy: 300, maxW: 185, maxH: 175 },
  pants: { cx: 200, cy: 462, maxW: 135, maxH: 250 },
  skirt: { cx: 200, cy: 405, maxW: 155, maxH: 165 },
  dress: { cx: 200, cy: 372, maxW: 165, maxH: 300 },
  shoes: { cx: 200, cy: 645, maxW: 160, maxH: 75 },
  bag: { cx: 272, cy: 398, maxW: 95, maxH: 105 },
  accessory: { cx: 200, cy: 195, maxW: 90, maxH: 65 },
}

/** 叠放层级（小的在下） */
export const LAYER_Z: Record<Category, number> = {
  pants: 1,
  skirt: 1,
  shoes: 2,
  dress: 3,
  top: 3,
  outerwear: 4,
  bag: 5,
  accessory: 6,
}

/** 新衣服按类别放进锚点框（contain 适配） */
export function defaultPlacement(
  cat: Category,
  imgW: number,
  imgH: number,
): Placement {
  const a = ANCHORS[cat]
  const scale = Math.min(a.maxW / imgW, a.maxH / imgH)
  return { cx: a.cx, cy: a.cy, w: imgW * scale, rot: 0, flip: false }
}
