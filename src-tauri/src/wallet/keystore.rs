//! 本地私钥加密存储（keystore）
//!
//! 安全模型（见 docs/SECURITY.md）：
//! - 助记词本地生成（BIP39）、私钥本地派生（BIP32）
//! - 私钥用 Argon2id 派生密钥 + XChaCha20 加密落盘
//! - 加密口令由用户自设，绝不发送到任何服务器
//!
//! ⚠️ M0 阶段：此处为接口占位 + 健康检查。
//!    真实加密实现将在 M0 后续提交中接入
//!    （依赖：bip39 / ed25519-dalek / argon2 / chacha20poly1305）。

use serde::Serialize;
use tauri::State;

/// keystore 健康检查：确认本地加密模块可初始化
#[tauri::command]
pub fn health(app: State<'_, crate::wallet::keystore::KeystoreState>) -> Result<KeystoreHealth, String> {
    Ok(KeystoreHealth {
        ready: app.initialized(),
        algorithm: "argon2id + xchacha20 (planned)",
        mnemonic_generation: "BIP39 local-only (planned)",
    })
}

#[derive(Serialize)]
pub struct KeystoreHealth {
    ready: bool,
    algorithm: &'static str,
    mnemonic_generation: &'static str,
}

/// keystore 状态（由 Tauri 管理，M0 起步为布尔占位）
pub struct KeystoreState {
    initialized: bool,
}

impl KeystoreState {
    pub fn initialized(&self) -> bool {
        self.initialized
    }
}

impl Default for KeystoreState {
    fn default() -> Self {
        // M0：尚未完成加密落盘实现，初始为 false
        Self { initialized: false }
    }
}
