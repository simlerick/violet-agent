//! settings — 配置读写（~/.violet-agent/config.json）
//!
//! 结构：
//! {
//!   "llm_api_key": "sk-xxx",        // 本地明文存储（用户自行掌控机器）
//!   "llm_base_url": "https://api.deepseek.com/v1",
//!   "llm_model": "deepseek-chat",
//!   "language": "en" | "zh"
//! }
//!
//! - settings_get：读取配置，API key 脱敏后返回（sk-****abcd），不泄露原文
//! - settings_save：保存配置（key 原文写盘，供 llm_chat 使用）
//! - llm_ping：用当前配置发一条最小请求测试连通性

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AppConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub llm_api_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub llm_base_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub llm_model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
}

#[derive(Serialize)]
pub struct SettingsView {
    /// 脱敏后的 key：存在则 "sk-****abcd"，否则 None
    pub llm_api_key_masked: Option<String>,
    pub llm_base_url: Option<String>,
    pub llm_model: Option<String>,
    pub language: Option<String>,
}

#[derive(Serialize)]
pub struct SaveReply {
    pub ok: bool,
    pub reason: Option<String>,
}

fn config_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
    PathBuf::from(home).join(".violet-agent").join("config.json")
}

fn load() -> AppConfig {
    match std::fs::read_to_string(config_path()) {
        Ok(text) => serde_json::from_str(&text).unwrap_or_default(),
        Err(_) => AppConfig::default(),
    }
}

fn mask_key(key: &str) -> Option<String> {
    if key.trim().is_empty() {
        return None;
    }
    let k = key.trim();
    if k.len() <= 4 {
        Some("****".into())
    } else {
        let tail = &k[k.len() - 4..];
        Some(format!("****{tail}"))
    }
}

#[tauri::command]
pub fn settings_get() -> SettingsView {
    let cfg = load();
    SettingsView {
        llm_api_key_masked: cfg.llm_api_key.as_deref().and_then(mask_key),
        llm_base_url: cfg.llm_base_url,
        llm_model: cfg.llm_model,
        language: cfg.language,
    }
}

/// 保存配置。只更新传入的非空字段；API key 传入空字符串则清除。
#[tauri::command]
pub fn settings_save(
    llm_api_key: Option<String>,
    llm_base_url: Option<String>,
    llm_model: Option<String>,
    language: Option<String>,
) -> SaveReply {
    let mut cfg = load();

    if let Some(k) = llm_api_key {
        let k = k.trim().to_string();
        cfg.llm_api_key = if k.is_empty() { None } else { Some(k) };
    }
    if let Some(u) = llm_base_url {
        let u = u.trim().to_string();
        cfg.llm_base_url = if u.is_empty() { None } else { Some(u) };
    }
    if let Some(m) = llm_model {
        let m = m.trim().to_string();
        cfg.llm_model = if m.is_empty() { None } else { Some(m) };
    }
    if let Some(l) = language {
        let l = l.trim().to_string();
        cfg.language = if l.is_empty() { None } else { Some(l) };
    }

    let path = config_path();
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    match serde_json::to_string_pretty(&cfg) {
        Ok(text) => match std::fs::write(&path, text) {
            Ok(_) => SaveReply { ok: true, reason: None },
            Err(e) => SaveReply { ok: false, reason: Some(format!("write: {e}")) },
        },
        Err(e) => SaveReply { ok: false, reason: Some(format!("encode: {e}")) },
    }
}

/// 用当前配置发一条最小消息测试连通性。
#[derive(Serialize)]
pub struct PingReply {
    pub ok: bool,
    pub detail: String,
}

#[tauri::command]
pub fn llm_ping() -> PingReply {
    let cfg = load();
    let Some(key) = cfg.llm_api_key.filter(|k| !k.trim().is_empty()) else {
        return PingReply { ok: false, detail: "no API key configured".into() };
    };
    let base = cfg
        .llm_base_url
        .unwrap_or_else(|| "https://api.deepseek.com/v1".into());
    let model = cfg.llm_model.unwrap_or_else(|| "deepseek-chat".into());

    let client = reqwest::blocking::Client::new();
    let body = json!({
        "model": model,
        "messages": [{"role": "user", "content": "Reply with exactly: OK"}],
        "max_tokens": 8,
    });
    match client
        .post(format!("{base}/chat/completions"))
        .bearer_auth(&key.trim())
        .json(&body)
        .timeout(std::time::Duration::from_secs(30))
        .send()
    {
        Ok(resp) => {
            let status = resp.status();
            if status.is_success() {
                PingReply { ok: true, detail: format!("connected · {model} @ {base}") }
            } else {
                let text = resp.text().unwrap_or_default();
                PingReply { ok: false, detail: format!("http {status}: {text}") }
            }
        }
        Err(e) => PingReply { ok: false, detail: format!("network: {e}") },
    }
}
