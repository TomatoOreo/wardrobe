import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '我的电子衣橱',
        short_name: '电子衣橱',
        description: '记录你拥有的衣服，用虚拟形象搭配穿搭',
        lang: 'zh-CN',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#fafaf9',
        theme_color: '#f97316',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // imgly 打进来的 onnxruntime wasm 体积超限且运行时不使用（模型走 /bgr/ 自托管），
        // 从预缓存排除；大文件由下方 runtimeCaching 按需缓存
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        globIgnores: ['**/bgr/**', 'assets/ort-*'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // 抠图模型分块：CacheFirst，缓存后可离线使用
            urlPattern: /\/bgr\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bgr-models',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            // onnxruntime 若按 hash 资产路径加载 wasm，也做持久缓存
            urlPattern: /\.wasm(\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-assets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
})
