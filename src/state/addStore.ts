import { create } from 'zustand'
import type { ItemSource } from '../db/consts'

export interface PendingImage {
  blob: Blob
  source: ItemSource
}

interface AddState {
  pending: PendingImage[]
  /** 本轮批量处理完成的衣物 id，用于"保存并下一件"导航 */
  processedIds: number[]
  setPending: (imgs: PendingImage[]) => void
  addProcessed: (id: number) => void
  clear: () => void
}

export const useAddStore = create<AddState>((set) => ({
  pending: [],
  processedIds: [],
  setPending: (pending) => set({ pending, processedIds: [] }),
  addProcessed: (id) => set((s) => ({ processedIds: [...s.processedIds, id] })),
  clear: () => set({ pending: [], processedIds: [] }),
}))
