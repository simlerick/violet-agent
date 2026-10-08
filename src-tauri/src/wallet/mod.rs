//! 子母钱包模块（安全核心）
//!
//! - mother.rs : 母钱包（主权绑定 / 转账 / 撤权 / 更换绑定）— M0 起
//! - child.rs  : 子钱包（执行 / 余额 / 风控边界）— M0 起
//! - keystore.rs: 本地私钥加密存储（助记词本地生成，永不上云）— M0 起

pub mod child;
pub mod keystore;
pub mod mother;
