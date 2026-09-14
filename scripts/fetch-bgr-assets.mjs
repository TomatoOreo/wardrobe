/**
 * 下载 @imgly/background-removal 的模型与运行时资源到 public/bgr/，实现自托管离线可用。
 * 只下载 isnet_fp16 模型 + ONNX Runtime wasm（约 123MB）。
 * 用法：node scripts/fetch-bgr-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const VERSION = '1.7.0'
const BASE = `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/dist`
const OUT = path.resolve('public/bgr')
const NEEDED = new Set([
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
  '/models/isnet_fp16',
])

const res = await fetch(`${BASE}/resources.json`)
if (!res.ok) throw new Error(`resources.json ${res.status}`)
const manifest = await res.json()
await mkdir(OUT, { recursive: true })
await writeFile(path.join(OUT, 'resources.json'), JSON.stringify(manifest))

const jobs = []
for (const [key, info] of Object.entries(manifest)) {
  if (!NEEDED.has(key)) continue
  for (const chunk of info.chunks ?? []) {
    jobs.push({ url: `${BASE}/${chunk.name}`, file: path.join(OUT, chunk.name) })
  }
}

let done = 0
const errors = []
await Promise.all(
  jobs.map(async (j) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await fetch(j.url)
        if (!r.ok) throw new Error(`${r.status}`)
        await writeFile(j.file, Buffer.from(await r.arrayBuffer()))
        done++
        console.log(`[${done}/${jobs.length}] ${path.basename(j.file)}`)
        return
      } catch (e) {
        if (attempt === 3) errors.push(`${j.url}: ${e.message}`)
        await new Promise((r) => setTimeout(r, 1500 * attempt))
      }
    }
  }),
)
if (errors.length) {
  console.error('FAILED:\n' + errors.join('\n'))
  process.exit(1)
}
console.log(`done: ${jobs.length} files -> public/bgr/`)
