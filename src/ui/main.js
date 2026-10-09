// Violet Agent 前端逻辑（M0 视觉 v4）
// - 中英文切换（默认英文）
// - keystore 健康检查
// - 指令输入框：打字/连接时通知悬浮球桌宠切动作（Tauri 事件）

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
    pnBalancePlaceholder: "awaiting setup",
    pnHistory: "History",
    pnSend: "Send Letter",
    pnSendPlaceholder: "type your order…",
    portraitCaption: "Auto Memory Doll",
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
    pnBalancePlaceholder: "等待接入",
    pnHistory: "历史流水",
    pnSend: "寄出指令",
    pnSendPlaceholder: "输入你的指令…",
    portraitCaption: "自动手记人偶",
  },
};

let currentLang = "en";
let pet = null; // 悬浮球事件发射器（Tauri 环境才有）

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  const btn = document.getElementById("langBtn");
  if (btn) btn.textContent = lang === "en" ? I18N.en.btnZh : I18N.en.btnEn;
  // placeholder 单独处理
  const input = document.getElementById("orderInput");
  if (input) input.placeholder = I18N[lang].pnSendPlaceholder;
}

async function setupPetEvents() {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    pet = { emit };
  } catch (e) {
    console.info("非 Tauri 环境，悬浮球事件跳过", e);
    pet = null;
  }
}

function notifyPet(action) {
  if (pet) pet.emit(`chibi:${action}`);
}

// keystore 健康检查
async function pingKeystore() {
  const el = document.getElementById("healthJson");
  if (!el) return;
  notifyPet("working"); // 连接中 → 桌宠思考
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    el.textContent = JSON.stringify(health);
    notifyPet("deliver"); // 拿到结果 → 递信
  } catch (e) {
    console.info("非 Tauri 环境，跳过 keystore 检查", e);
    el.textContent = "browser preview (no Tauri)";
    notifyPet("idle");
  }
}

// 指令输入框：打字 → Think；发送 → 模拟处理 → Deliver
function setupOrderBox() {
  const input = document.getElementById("orderInput");
  const send = document.getElementById("sendBtn");
  if (!input || !send) return;
  input.addEventListener("input", () => notifyPet("typing"));
  input.addEventListener("blur", () => {
    if (!input.value) notifyPet("idle");
  });
  send.addEventListener("click", () => {
    if (!input.value.trim()) return;
    notifyPet("working"); // 连接/处理中 → 思考
    setTimeout(() => {
      notifyPet("deliver"); // 处理完成 → 递信
      input.value = "";
      input.blur();
      setTimeout(() => notifyPet("idle"), 2400);
    }, 1600);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang("en");
  const btn = document.getElementById("langBtn");
  if (btn) btn.addEventListener("click", () => applyLang(currentLang === "en" ? "zh" : "en"));
  setupPetEvents().then(() => {
    pingKeystore();
    setupOrderBox();
  });
});
