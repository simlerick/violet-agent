// Violet Agent 前端逻辑（M0 视觉 v2）
// - 中英文切换（默认英文，中文表已就绪）
// - keystore 健康检查（Tauri invoke -> wallet::keystore::health）
// - Q 版桌宠交互预留（后续接入动作帧/动画）

const I18N = {
  en: {
    appName: "Violet Agent",
    navWallet: "Wallet",
    navPortfolio: "Portfolio",
    navOrders: "Orders",
    navSettings: "Settings",
    navMother: "Mother Key",
    footQuote: "Written by hand, kept with love.",
    btnZh: "中文",
    btnEn: "English",
    cardOverviewTitle: "Wallet Overview",
    cardKeystore: "Keystore",
    cardTxTitle: "Recent Transactions",
    cardTxPlaceholder: "Awaiting on-chain activity.",
    cardSlTitle: "Stop-Loss",
    cardSlSwitch: "Enable guard",
    cardSlHint: "Limits apply to child wallet only.",
    portraitCaption: "Auto Memory Doll",
  },
  zh: {
    appName: "紫罗兰特工",
    navWallet: "钱包",
    navPortfolio: "持仓",
    navOrders: "指令",
    navSettings: "设置",
    navMother: "母钱包",
    footQuote: "执笔以寄，珍藏于心。",
    btnZh: "中文",
    btnEn: "English",
    cardOverviewTitle: "钱包总览",
    cardKeystore: "本地加密存储",
    cardTxTitle: "近期流水",
    cardTxPlaceholder: "等待链上活动…",
    cardSlTitle: "止损设置",
    cardSlSwitch: "启用守护",
    cardSlHint: "限额仅对子钱包生效。",
    portraitCaption: "自动手记人偶",
  },
};

let currentLang = "en";

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  const btn = document.getElementById("langBtn");
  if (btn) btn.textContent = lang === "en" ? I18N.en.btnZh : I18N.en.btnEn;
}

// 桌宠：点击时小幅跳动（动作帧后续接入）
function setupChibi() {
  const chibi = document.getElementById("chibi");
  if (!chibi) return;
  chibi.addEventListener("click", () => {
    chibi.style.animation = "none";
    chibi.offsetHeight; // reflow
    chibi.style.animation = "chibiFloat 3.6s ease-in-out infinite";
  });
}

// 止损开关
function setupSwitch() {
  const sw = document.getElementById("slSwitch");
  if (!sw) return;
  sw.addEventListener("click", () => sw.classList.toggle("on"));
}

// keystore 健康检查（Tauri -> Rust）
async function pingKeystore() {
  const el = document.getElementById("healthJson");
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    if (el) el.textContent = JSON.stringify(health);
  } catch (e) {
    // 非 Tauri 环境（纯浏览器预览）时静默
    console.info("非 Tauri 环境，跳过 keystore 检查", e);
    if (el) el.textContent = "browser preview (no Tauri)";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang("en"); // 第一版：默认英文（中文表已就绪，后续一键切换）
  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      applyLang(currentLang === "en" ? "zh" : "en");
    });
  }
  setupChibi();
  setupSwitch();
  pingKeystore();
});
