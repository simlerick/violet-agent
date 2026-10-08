import { defineConfig } from "vite";

// Tauri 开发端口，与 tauri.conf.json 的 devUrl 保持一致
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // 防止 Vite 清空 Rust 编辑器的 warning
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // Tauri 在 Windows 上支持 'base64'；macOS 支持 'safari'
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    outDir: "dist",
  },
});
