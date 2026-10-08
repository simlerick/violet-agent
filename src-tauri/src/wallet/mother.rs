//! 母钱包（Mother Wallet）—— 主人掌控的资金主权
//!
//! 职责：
//! - 唯一主人绑定：首次初始化由母钱包签名识别、记住「主人身份」
//! - 转账 / 授权：向子钱包转账 = 显式授予该笔资金 100% 使用权
//! - 撤权 / 回收：随时终止子钱包权限、回收剩余资金
//! - 更换绑定：旧母钱包签名发起 → 新母钱包签名确认（双签迁移）
//!
//! ⚠️ M0 阶段：数据模型占位。签名/多签逻辑将在 M0 后续提交接入。

use serde::Serialize;

/// 母钱包 —— 主人唯一主权者
#[derive(Clone, Default, Serialize)]
pub struct MotherWallet {
    /// 母钱包公钥地址（主人身份标识）
    pub address: Option<String>,
    /// 是否已绑定主人（首次初始化确认）
    pub bound: bool,
    /// 是否启用撤权/回收
    pub revocation_enabled: bool,
}

impl MotherWallet {
    /// 当前是否已确认主人绑定
    pub fn is_bound(&self) -> bool {
        self.bound && self.address.is_some()
    }
}
