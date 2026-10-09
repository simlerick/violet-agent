//! Violet Agent — 桌面端链上交易 AI Agent + 子母钱包
//!
//! 模块划分（对应 docs/ARCHITECTURE.md）：
//! - wallet  : 子母钱包（keystore 本地助记词/私钥 + mother/child 模型）
//! - agent   : LLM 编排 + 意图解析（M1）
//! - risk    : 风控（止损 / 限额 / 白名单）（M3）
//! - monitor : 链上监控（M3）

mod wallet;

use tauri::{
    Manager, RunEvent, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

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
            // 桌宠窗口：无背景 Q 版角色，固定右下角、透明、置顶、不可移动（豆包式悬浮精灵）
            if let Ok(Some(monitor)) = app.primary_monitor() {
                let size = monitor.size();
                let w = 280.0;
                let h = 470.0;
                let scale = monitor.scale_factor();
                let x = (size.width as f64 - w * scale) / scale - 24.0;
                let y = (size.height as f64 - h * scale) / scale - 80.0;
                let _ = WebviewWindowBuilder::new(app, "chibi", WebviewUrl::App("chibi.html".into()))
                    .title("Violet Pet")
                    .inner_size(w, h)
                    .resizable(false)
                    .transparent(true)
                    .decorations(false)
                    .always_on_top(true)
                    .skip_taskbar(true)
                    .shadow(false)
                    .position(x, y)
                    .build();
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // 主窗口关闭 → 隐藏主窗口，显示桌宠（点 dock 图标可重新打开主窗口）
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                    let app = window.app_handle();
                    if let Some(chibi) = app.get_webview_window("chibi") {
                        let _ = chibi.show();
                        let _ = chibi.set_focus();
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Violet Agent")
        .run(|app_handle, event| {
            // macOS：点击 Dock 图标重新打开 → 恢复主窗口、隐藏桌宠
            if let RunEvent::Reopen { has_visible_windows: _, .. } = event {
                if let Some(main) = app_handle.get_webview_window("main") {
                    let _ = main.show();
                    let _ = main.set_focus();
                }
                if let Some(chibi) = app_handle.get_webview_window("chibi") {
                    let _ = chibi.hide();
                }
            }
        });
}
