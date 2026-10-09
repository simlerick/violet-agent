// Violet Agent 前端逻辑（M0 视觉 v5）
// - 导航切换视图（Wallet/Portfolio/Orders/Settings/Mother Key 可用）
// - 立绘随动作变化（按钮 / 打字 / 连接联动，带动画）
// - 悬浮球桌宠事件联动（Tauri）

const I18N = {
  en: {
    appName: "Violet Agent",
    navWallet: "Wallet",
    navPortfolio: "Portfolio",
    navOrders: "Orders",
    navSettings: "Settings",
    navMother: "Mother Key",
    pnWalletStatus: "Wallet Status",
    pnBalance: "Balance",
    pnBalancePlaceholder: "awaiting setup",
    pnHistory: "History",
    pnSend: "Send Letter",
    pnSendPlaceholder: "type your order…",
    pnSelf: "Self",
    pnPortfolio: "Portfolio",
    pnOrders: "Orders",
    pnSettings: "Settings",
    pnMother: "Mother Key",
    pnComing: "coming soon",
    actIdle: "Idle",
    actWave: "Wave",
    actDeliver: "Deliver Letter",
    actThink: "Think",
    btnZh: "中文",
    btnEn: "English",
    healthBrowser: "browser preview (no Tauri)",
  },
  zh: {
    appName: "紫罗兰特工",
    navWallet: "钱包",
    navPortfolio: "持仓",
    navOrders: "指令",
    navSettings: "设置",
    navMother: "母钱包",
    pnWalletStatus: "钱包状态",
    pnBalance: "余额",
    pnBalancePlaceholder: "等待接入",
    pnHistory: "历史流水",
    pnSend: "寄出指令",
    pnSendPlaceholder: "输入你的指令…",
    pnSelf: "人偶",
    pnPortfolio: "持仓",
    pnOrders: "指令",
    pnSettings: "设置",
    pnMother: "母钱包",
    pnComing: "即将上线",
    actIdle: "待机",
    actWave: "挥手",
    actDeliver: "递信",
    actThink: "思考",
    btnZh: "中文",
    btnEn: "English",
    healthBrowser: "浏览器预览（无 Tauri）",
  },
};

let currentLang = "en";
let pet = null;

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  const btn = document.getElementById("langBtn");
  if (btn) btn.textContent = lang === "en" ? I18N.en.btnZh : I18N.en.btnEn;
  const input = document.getElementById("orderInput");
  if (input) input.placeholder = I18N[lang].pnSendPlaceholder;
}

// ---------- 导航切换（视图可用） ----------
function setupNav() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      const view = document.getElementById(`view-${item.dataset.key}`);
      if (view) view.classList.add("active");
    });
  });
}

// ---------- 立绘动作 ----------
const PORTRAIT_ACTIONS = {
  idle: { anim: "p-idle", pet: "idle" },
  wave: { anim: "p-wave", pet: "wave" },
  deliver: { anim: "p-deliver", pet: "deliver" },
  think: { anim: "p-think", pet: "think" },
};
let currentAction = "idle";

function setAction(action) {
  currentAction = action;
  const portrait = document.getElementById("mainPortrait");
  const cfg = PORTRAIT_ACTIONS[action] || PORTRAIT_ACTIONS.idle;
  if (portrait) {
    portrait.dataset.action = action;
    portrait.classList.remove("p-idle", "p-wave", "p-deliver", "p-think");
    // 强制重启动画
    void portrait.offsetWidth;
    portrait.classList.add(cfg.anim);
  }
  document.querySelectorAll(".action-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.action === action);
  });
  notifyPet(cfg.pet);
}

function setupActions() {
  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", () => setAction(btn.dataset.action));
  });
}

// ---------- Tauri 事件 ----------
async function setupPetEvents() {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    pet = { emit };
  } catch (e) {
    pet = null;
  }
}
function notifyPet(action) {
  if (pet) pet.emit(`chibi:${action}`);
}

// ---------- keystore 健康检查 ----------
async function pingKeystore() {
  const el = document.getElementById("healthJson");
  if (!el) return;
  setAction("think"); // 连接中 → 思考
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    el.textContent = JSON.stringify(health);
    setAction("deliver"); // 拿到结果 → 递信
    setTimeout(() => setAction("idle"), 2200);
  } catch (e) {
    el.textContent = I18N[currentLang].healthBrowser;
    setAction("idle");
  }
}

// ---------- 指令输入框 ----------
function setupOrderBox() {
  const input = document.getElementById("orderInput");
  const send = document.getElementById("sendBtn");
  if (!input || !send) return;
  input.addEventListener("input", () => setAction("think"));
  input.addEventListener("blur", () => {
    if (!input.value) setAction("idle");
  });
  send.addEventListener("click", () => {
    if (!input.value.trim()) return;
    setAction("think"); // 处理中
    setTimeout(() => {
      setAction("deliver"); // 完成 → 递信
      input.value = "";
      input.blur();
      setTimeout(() => setAction("idle"), 2400);
    }, 1500);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });
}

// ---------- Self 开关（桌宠联动） ----------
function setupSelf() {
  const toggle = document.getElementById("selfToggle");
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    // M0：开关联动桌宠显隐（Tauri 环境）
    notifyPet(toggle.checked ? "idle" : "hidden");
  });
}

// ---------- 窗口控制（无边框） ----------
function setupWinControls() {
  const min = document.getElementById("winMin");
  const close = document.getElementById("winClose");
  if (!min && !close) return;
  Promise.all([
    import("@tauri-apps/api/window"),
  ])
    .then(([win]) => {
      if (min) min.addEventListener("click", () => win.getCurrentWindow().minimize());
      if (close) close.addEventListener("click", () => win.getCurrentWindow().close());
    })
    .catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang("en");
  const btn = document.getElementById("langBtn");
  if (btn) btn.addEventListener("click", () => applyLang(currentLang === "en" ? "zh" : "en"));
  setupNav();
  setupActions();
  setupSelf();
  setupWinControls();
  setupPetEvents().then(() => {
    pingKeystore();
    setupOrderBox();
  });
});
