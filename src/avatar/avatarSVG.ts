import type { AvatarConfig } from '../db/db'

/** 舞台 400x700 内的扁平卡通人形，参数化肤色 / 发型 / 发色 */

export const SKIN_TONES = ['#f7d0be', '#f2c19c', '#e8a87c', '#c98d63', '#a96f4c', '#8a5a3b']

export const HAIR_COLORS = [
  { key: '#2b2622', label: '黑' },
  { key: '#3f3229', label: '深棕' },
  { key: '#6b4a2f', label: '棕' },
  { key: '#8c6239', label: '浅棕' },
  { key: '#b48a5a', label: '亚麻' },
  { key: '#c9c1b8', label: '灰白' },
  { key: '#a63d32', label: '酒红' },
]

export const HAIR_STYLES = [
  { key: 'long', label: '长发' },
  { key: 'short', label: '短发' },
  { key: 'bob', label: '波波头' },
  { key: 'curly', label: '卷发' },
  { key: 'bun', label: '丸子头' },
] as const

const FRINGE =
  'M138 148 C136 104 164 76 200 76 C236 76 264 104 262 148 C254 124 238 112 222 114 ' +
  'C208 116 196 108 178 110 C158 112 146 128 138 148 Z'

const TORSO =
  'M200 242 C172 242 150 254 144 278 C139 300 150 318 153 342 C155 358 152 368 153 380 ' +
  'L247 380 C248 368 245 358 247 342 C250 318 261 300 256 278 C250 254 228 242 200 242 Z'

export function avatarSVG(c: AvatarConfig): string {
  const skin = c.skin
  const hair = c.hairColor

  const backParts: string[] = []
  if (c.hair === 'bob') backParts.push(`<rect x="132" y="78" width="136" height="156" rx="56" fill="${hair}"/>`)
  if (c.hair === 'long') backParts.push(`<rect x="130" y="76" width="140" height="266" rx="60" fill="${hair}"/>`)
  if (c.hair === 'curly') {
    for (const [cx, cy, r] of [
      [156, 104, 28],
      [200, 90, 32],
      [244, 104, 28],
    ]) {
      backParts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${hair}"/>`)
    }
  }

  const frontParts: string[] = [`<path d="${FRINGE}" fill="${hair}"/>`]
  if (c.hair === 'bun') frontParts.push(`<circle cx="200" cy="60" r="24" fill="${hair}"/>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" width="100%" height="100%">
  <ellipse cx="200" cy="668" rx="92" ry="12" fill="rgba(0,0,0,0.06)"/>
  ${backParts.join('\n  ')}
  <g fill="${skin}">
    <rect x="165" y="380" width="28" height="266" rx="14"/>
    <rect x="207" y="380" width="28" height="266" rx="14"/>
    <ellipse cx="177" cy="650" rx="18" ry="11"/>
    <ellipse cx="223" cy="650" rx="18" ry="11"/>
    <rect x="152" y="366" width="96" height="46" rx="23"/>
    <path d="${TORSO}"/>
    <rect x="126" y="256" width="27" height="162" rx="13.5" transform="rotate(7 139 262)"/>
    <rect x="247" y="256" width="27" height="162" rx="13.5" transform="rotate(-7 261 262)"/>
    <rect x="187" y="196" width="26" height="46" rx="12"/>
  </g>
  <ellipse cx="200" cy="202" rx="15" ry="6" fill="rgba(0,0,0,0.08)"/>
  <circle cx="139" cy="146" r="10" fill="${skin}"/>
  <circle cx="261" cy="146" r="10" fill="${skin}"/>
  <circle cx="200" cy="140" r="62" fill="${skin}"/>
  <g fill="#3f3a36">
    <circle cx="179" cy="146" r="5.2"/>
    <circle cx="221" cy="146" r="5.2"/>
  </g>
  <circle cx="180.6" cy="144.2" r="1.7" fill="#fff" opacity="0.9"/>
  <circle cx="222.6" cy="144.2" r="1.7" fill="#fff" opacity="0.9"/>
  <circle cx="166" cy="161" r="7" fill="#ef9a8a" opacity="0.4"/>
  <circle cx="234" cy="161" r="7" fill="#ef9a8a" opacity="0.4"/>
  <path d="M191 167 Q200 175 209 167" stroke="#b26a55" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${frontParts.join('\n  ')}
</svg>`
}
