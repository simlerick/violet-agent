//! Violet Agent — 桌面端链上交易 AI Agent + 子母钱包
//!
//! 模块划分（对应 docs/ARCHITECTURE.md）：
//! - wallet  : 子母钱包（keystore 本地助记词/私钥 + mother/child 模型）
//! - agent   : LLM 编排 + 意图解析（M1）
//! - risk    : 风控（止损 / 限额 / 白名单）（M3）
//! - monitor : 链上监控（M3）

mod wallet;
mod agent;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 启动时加载子母钱包模型（M0）
    let _mother = wallet::mother::MotherWallet::default();
    let _child = wallet::child::ChildWallet::default();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(wallet::keystore::KeystoreState::default())
        .invoke_handler(tauri::generate_handler![
            // M0: 本地钱包只读接口
            wallet::keystore::health,
            // M1: LLM 对话网关（OpenAI 兼容 API，默认 Deepseek）
            agent::llm_chat
        ])
        .build(tauri::generate_context!())
        .expect("error while building Violet Agent")
        .run(|_app_handle, _event| {});
}
