// Violet Agent 前端入口（M0 占位）
// 后续里程碑：接入 Tauri invoke（钱包健康检查、对话、交易、流水、止损面板）

console.log("🌸 Violet Agent UI 已加载 (M0)");

// 预留：调用 Tauri 后端 keystore 健康检查
async function pingKeystore() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    document.querySelector("code").textContent = JSON.stringify(health);
  } catch (e) {
    // 非 Tauri 环境（纯浏览器预览）时静默
    console.info("非 Tauri 环境，跳过 keystore 检查", e);
  }
}

pingKeystore();
