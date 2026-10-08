//! 子钱包（Child Wallet）—— Violet 的执行钱包（100% 使用权）
//!
//! 职责：
//! - 持有主人转入的资金，执行交易
//! - 主人向子钱包转账 = 自动获得该笔资金 100% 使用权
//! - 风控边界（止损 / 限额 / 白名单）在这一层执行
//!
//! ⚠️ M0 阶段：数据模型占位。交易执行与风控将在 M2/M3 接入。

use serde::Serialize;

/// 子钱包 —— Violet 持有的执行钱包
#[derive(Clone, Default, Serialize)]
pub struct ChildWallet {
    /// 子钱包公钥地址
    pub address: Option<String>,
    /// 当前托管余额（由母钱包转入）
    pub balance_held: u64,
    /// 单笔限额（硬编码，LLM 无权覆盖）
    pub max_single_tx: u64,
    /// 是否启用自动执行
    pub auto_execute: bool,
}

impl ChildWallet {
    /// 单笔交易是否在限额内
    pub fn within_limit(&self, amount: u64) -> bool {
        amount <= self.max_single_tx
    }
}
