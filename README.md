# 提示词框架 (Prompt Framework)

一款轻量级 Windows 桌面工具：选中文字 → 按快捷键 → 鼠标位置弹出小窗 → AI 自动整理成结构化提示词。

## 特性

- 🎯 **全局快捷键**：任意应用中选中文字，按下快捷键即刻抓取
- 🪟 **浮窗式 UI**：在鼠标位置弹出小窗，实时流式显示生成过程
- 📝 **可编辑模板**：内置 3 套模板（任务执行 / 代码生成 / 通用），全部可编辑
- ➕ **自定义模板**：支持新建、克隆、删除自己的模板
- 🔌 **通用 API**：兼容 OpenAI、Ollama 等任何 OpenAI 兼容接口
- 💾 **轻量安装包**：NSIS 安装包仅约 3 MB

## 使用方法

1. 下载安装包并安装
2. 启动应用（首次启动会显示设置窗口）
3. 在"基本"标签页填入你的 API Base URL、API Key、模型名
4. 点击"保存设置"，关闭设置窗口
5. 任意应用中选中文字，按 `Ctrl+Alt+Shift+P`（可在设置中修改）
6. 鼠标位置弹出小窗，自动生成结构化提示词
7. 点击"复制"即可使用

## 快捷键

默认：`Ctrl+Alt+Shift+P`

在"基本"标签页可修改并检测占用。

## 自定义模板

切换到"模板"标签页：
- **内置模板**：可编辑（修改会被标记为"已修改"），可一键重置为默认值
- **新建模板**：从空白或克隆现有模板开始
- 字段支持 key / label / instruction 三个属性
- 输出格式用 `{{key}}` 引用字段

## 技术栈

- Tauri 2（Rust 后端 + WebView 前端）
- React 19 + TypeScript + Tailwind CSS 3
- Zustand 状态管理
- 原生 SSE fetch 调用 OpenAI 兼容 API

## 本地开发

环境要求：
- Rust 1.96+（MSVC 工具链）
- Node.js 24+
- Visual Studio Build Tools 2022
- WebView2 Runtime（Win11 自带）

```bash
npm install
npm run tauri dev
```

## 构建安装包

```bash
npm run tauri build
```

产物路径：
- `src-tauri/target/release/bundle/nsis/*.exe`
- `src-tauri/target/release/bundle/msi/*.msi`
