import type { AvatarConfig } from '../db/db'
import { avatarSVG } from './avatarSVG'

interface Props {
  config: AvatarConfig
  className?: string
}

/** 以 SVG 字符串渲染的卡通形象（与快照导出共用同一份绘制源） */
export function AvatarBody({ config, className }: Props) {
  return (
    <div
      className={className}
      style={{ lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: avatarSVG(config) }}
    />
  )
}
