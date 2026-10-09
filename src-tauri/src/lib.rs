//! Violet Agent — 桌面端链上交易 AI Agent + 子母钱包
//!
//! 模块划分（对应 docs/ARCHITECTURE.md）：
//! - wallet  : 子母钱包（keystore 本地助记词/私钥 + mother/child 模型）
//! - agent   : LLM 编排 + 意图解析（M1）
//! - risk    : 风控（止损 / 限额 / 白名单）（M3）
//! - monitor : 链上监控（M3）

mod wallet;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

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
            wallet::keystore::health
        ])
        .setup(|app| {
            // 悬浮球桌宠：透明、置顶、无边框、跳过任务栏（豆包式）
            if let Some(main_win) = app.get_webview_window("main") {
                if let Ok(pos) = main_win.outer_position() {
                    let size = main_win.outer_size().unwrap_or_default();
                    let scale = main_win.scale_factor().unwrap_or(1.0);
                    let x = (pos.x as f64 + size.width as f64 - 160.0) / scale;
                    let y = (pos.y as f64 + size.height as f64 - 230.0) / scale;
                    let _ = WebviewWindowBuilder::new(
                        app,
                        "chibi",
                        WebviewUrl::App("chibi.html".into()),
                    )
                    .title("Violet Pet")
                    .inner_size(140.0, 200.0)
                    .resizable(false)
                    .transparent(true)
                    .decorations(false)
                    .always_on_top(true)
                    .skip_taskbar(true)
                    .shadow(false)
                    .position(x, y)
                    .build();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Violet Agent");
}
