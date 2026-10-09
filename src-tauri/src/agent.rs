//! agent — M1：LLM 对话网关
//!
//! 走 OpenAI 兼容 Chat Completions 协议（默认 Deepseek）：
//! - 模型：  deepseek-chat
//! - Base：  https://api.deepseek.com/v1
//! - Key 来源：环境变量 VIOLET_LLM_API_KEY，或 ~/.violet-agent/config.json {"llm_api_key": "..."}
//! 未配置 Key 时返回 reason="no_api_key"，由前端降级为本地规则回复。

use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize)]
pub struct LlmReply {
    pub ok: bool,
    pub content: Option<String>,
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ChatMsg {
    pub role: String,
    pub content: String,
}

const TIMEOUT_SECS: u64 = 60;

#[tauri::command]
pub fn llm_chat(messages: Vec<ChatMsg>) -> LlmReply {
    let Some(key) = api_key() else {
        return LlmReply { ok: false, content: None, reason: Some("no_api_key".into()) };
    };

    let base = std::env::var("VIOLET_LLM_BASE_URL")
        .unwrap_or_else(|_| "https://api.deepseek.com/v1".into());
    let model = std::env::var("VIOLET_LLM_MODEL")
        .unwrap_or_else(|_| "deepseek-chat".into());

    let client = reqwest::blocking::Client::new();
    let body = json!({
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    });

    let result = client
        .post(format!("{base}/chat/completions"))
        .bearer_auth(&key)
        .json(&body)
        .timeout(std::time::Duration::from_secs(TIMEOUT_SECS))
        .send();

    match result {
        Ok(resp) => {
            let status = resp.status();
            if !status.is_success() {
                let text = resp.text().unwrap_or_default();
                return LlmReply {
                    ok: false,
                    content: None,
                    reason: Some(format!("http {status}: {text}")),
                };
            }
            match resp.json::<serde_json::Value>() {
                Ok(v) => match v["choices"][0]["message"]["content"].as_str() {
                    Some(c) => LlmReply { ok: true, content: Some(c.to_string()), reason: None },
                    None => LlmReply {
                        ok: false,
                        content: None,
                        reason: Some("empty model response".into()),
                    },
                },
                Err(e) => LlmReply {
                    ok: false,
                    content: None,
                    reason: Some(format!("bad json: {e}")),
                },
            }
        }
        Err(e) => LlmReply {
            ok: false,
            content: None,
            reason: Some(format!("reqwest: {e}")),
        },
    }
}

/// Key 来源：环境变量优先，其次 ~/.violet-agent/config.json
fn api_key() -> Option<String> {
    if let Ok(k) = std::env::var("VIOLET_LLM_API_KEY") {
        if !k.trim().is_empty() {
            return Some(k.trim().to_string());
        }
    }
    let home = std::env::var("HOME").ok()?;
    let path = std::path::Path::new(&home)
        .join(".violet-agent")
        .join("config.json");
    let text = std::fs::read_to_string(path).ok()?;
    let v: serde_json::Value = serde_json::from_str(&text).ok()?;
    v["llm_api_key"].as_str().map(|s| s.to_string())
}
