// Violet Agent 前端逻辑（M0 视觉 v3 —— 参考原版 UI）
// - 中英文切换（默认英文，中文表已就绪）
// - keystore 健康检查（Tauri invoke -> wallet::keystore::health）
// - Q 版桌宠动作切换（Idle / Wave / Deliver Letter / Think）

const I18N = {
  en: {
    appName: "Violet Agent",
    navWallet: "Wallet",
    navPortfolio: "Portfolio",
    navOrders: "Orders",
    navSettings: "Settings",
    navMother: "Mother Key",
    btnZh: "中文",
    btnEn: "English",
    pnWalletStatus: "Wallet Status",
    pnBalance: "Balance",
    pnBalancePlaceholder: "Child wallet on Solana, awaiting setup.",
    pnHistory: "History",
    pnHistoryPlaceholder: "No letters sent yet.",
    pnSend: "Send Letter",
    pnSendBtn: "Compose order",
    portraitCaption: "Auto Memory Doll",
    actIdle: "Idle",
    actWave: "Wave",
    actDeliver: "Deliver Letter",
    actThink: "Think",
    bubbleDeliver: "A letter for you.",
    bubbleThink: "Hmm…",
  },
  zh: {
    appName: "紫罗兰特工",
    navWallet: "钱包",
    navPortfolio: "持仓",
    navOrders: "指令",
    navSettings: "设置",
    navMother: "母钱包",
    btnZh: "中文",
    btnEn: "English",
    pnWalletStatus: "钱包状态",
    pnBalance: "余额",
    pnBalancePlaceholder: "子钱包已预留，等待 Solana 接入。",
    pnHistory: "历史流水",
    pnHistoryPlaceholder: "尚未发出任何信件。",
    pnSend: "寄出指令",
    pnSendBtn: "撰写订单",
    portraitCaption: "自动手记人偶",
    actIdle: "待机",
    actWave: "挥手",
    actDeliver: "递信",
    actThink: "思考",
    bubbleDeliver: "这是寄给你的信。",
    bubbleThink: "唔……",
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

// 桌宠动作切换：按钮点亮 + 动画切换 + 气泡
function setupChibiActions() {
  const chibi = document.getElementById("chibi");
  const buttons = document.querySelectorAll(".action-btn");
  if (!chibi || !buttons.length) return;

  const bubble = chibi.querySelector(".bubble");
  const img = document.getElementById("chibiImg");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const action = btn.dataset.action;
      chibi.dataset.action = action;
      // 真动作帧切换：/assets/chibi-{action}.png（wave/deliver/think/idle）
      if (img) img.src = `/assets/chibi-${action}.png`;
      // 气泡（仅递信/思考有文案）
      if (bubble && (action === "deliver" || action === "think")) {
        bubble.textContent = I18N[currentLang][action === "deliver" ? "bubbleDeliver" : "bubbleThink"];
        bubble.classList.remove("hidden");
        clearTimeout(bubble._t);
        bubble._t = setTimeout(() => bubble.classList.add("hidden"), 2200);
      } else if (bubble) {
        bubble.classList.add("hidden");
      }
      // 点击反馈：动作按钮组是触发点，桌宠本身给个轻微弹跳
      chibi.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
        { duration: 320 }
      );
    });
  });
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
  applyLang("en"); // 第一版：默认英文（中文表已就绪）
  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.addEventListener("click", () => applyLang(currentLang === "en" ? "zh" : "en"));
  }
  setupChibiActions();
  pingKeystore();
});
