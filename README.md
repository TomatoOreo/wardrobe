# 我的电子衣橱

一款隐私优先的本地电子衣橱 Web 应用（PWA）：拍照/上传衣服自动抠图记录，用 2D 虚拟形象试穿搭配，数据全部保存在本设备。

## 功能

- **记录衣物**：拍照 / 相册 / 其他 App 图片导入（支持粘贴、拖拽），AI 自动抠图（端侧运行，免费离线），批量录入，属性管理（类别/颜色/季节/品牌/价格/收藏）
- **虚拟试穿**：可定制的 2D 卡通形象（肤色/发型/发色），点选衣物上身，拖拽/缩放/旋转/翻转微调并记忆摆放
- **穿搭**：一键保存当前搭配生成封面快照，可回试衣间再次搭配
- **备份**：一键导出 zip（清单 + 图片），新设备导入即恢复

## 运行

```bash
npm install
npm run dev        # 开发（http://127.0.0.1:5173）
npm run build      # 生产构建（含 PWA Service Worker）
npm run preview    # 预览生产构建
```

抠图模型已自托管在 `public/bgr/`（约 117MB，勿提交到 git）。若缺失，运行：

```bash
node scripts/fetch-bgr-assets.mjs
```

## 技术栈

Vite + React 19 + TypeScript + Tailwind CSS 4 · Dexie (IndexedDB) · zustand · @imgly/background-removal（isnet_fp16，浏览器内 ONNX 推理）· vite-plugin-pwa · fflate

## 结构

```
src/
  db/          Dexie 表结构（items/outfits/avatars/settings）与常量
  lib/         图片压缩/缩略图/透明裁剪、抠图封装、备份导入导出、封面快照
  avatar/      2D 卡通形象 SVG（界面渲染与封面快照共用）
  state/       zustand（添加批次 / 试衣间会话）
  components/  底部导航、头部、图标、Toast、Blob 图片
  pages/       衣橱、添加、相机、批量处理、衣物详情、试衣间、穿搭列表/详情、设置
```

## 已知限制

- 首次抠图需加载约 120MB 模型资源（本机提供，Service Worker 缓存后离线可用）
- iOS Safari 的 PWA 不支持系统级"分享到 App"：先存相册再导入；Android 可直接分享（manifest 已配置 share_target）
- iOS 网页存储可能被系统清理，建议"添加到主屏幕"安装使用，并定期导出备份
- 抠图对复杂背景偶有瑕疵，可在衣物详情页随时"重新抠图"（始终保留原图）
