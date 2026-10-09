// Violet Agent 前端逻辑（M0 视觉 v6：整图模板 + 热区）
// - 导航热区切换（Wallet 显示数据，其他视图显示提示）
// - 立绘动作联动（按钮/打字/连接 → 动作动画 + 桌宠事件）
// - 无边框窗口控制

const I18N = {
  en: {
    btnZh: "中文",
    btnEn: "English",
    pnSendPlaceholder: "type your order…",
    actIdle: "Idle",
    actWave: "Wave",
    actDeliver: "Deliver Letter",
    actThink: "Think",
    healthBrowser: "browser preview (no Tauri)",
    viewWallet: "Wallet",
    viewPortfolio: "Portfolio · coming with M3 · on-chain",
    viewOrders: "Orders · coming with M4 · trading",
    viewSettings: "Settings · coming soon",
    viewMother: "Mother Key · local-only · BIP39",
  },
  zh: {
    btnZh: "中文",
    btnEn: "English",
    pnSendPlaceholder: "输入你的指令…",
    actIdle: "待机",
    actWave: "挥手",
    actDeliver: "递信",
    actThink: "思考",
    healthBrowser: "浏览器预览（无 Tauri）",
    viewWallet: "钱包",
    viewPortfolio: "持仓 · M3 上线 · 链上",
    viewOrders: "指令 · M4 上线 · 交易",
    viewSettings: "设置 · 即将上线",
    viewMother: "母钱包 · 仅本地 · BIP39",
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

// ---------- 导航热区切换 ----------
function setupNav() {
  const hint = document.getElementById("viewHint");
  const health = document.getElementById("healthJson");
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const key = item.dataset.key;
      if (!hint) return;
      if (key === "wallet") {
        hint.classList.add("hidden");
        if (health) health.classList.remove("hidden");
      } else {
        const label = I18N[currentLang][`view${key[0].toUpperCase()}${key.slice(1)}`] || I18N.en.viewWallet;
        hint.textContent = label;
        hint.classList.remove("hidden");
        if (health) health.classList.add("hidden");
      }
    });
  });
}

// ---------- 立绘动作 ----------
const PORTRAIT_ACTIONS = {
  idle: { pet: "idle" },
  wave: { pet: "wave" },
  deliver: { pet: "deliver" },
  think: { pet: "think" },
};

function setAction(action) {
  document.querySelectorAll(".action-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.action === action);
  });
  const cfg = PORTRAIT_ACTIONS[action] || PORTRAIT_ACTIONS.idle;
  const portrait = document.getElementById("mainPortrait");
  if (portrait) {
    portrait.classList.remove("p-idle", "p-wave", "p-deliver", "p-think");
    void portrait.offsetWidth; // 重启动画
    portrait.classList.add(`p-${action}`);
  }
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
  setAction("think");
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    el.textContent = JSON.stringify(health);
    setAction("deliver");
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
    setAction("think");
    setTimeout(() => {
      setAction("deliver");
      input.value = "";
      input.blur();
      setTimeout(() => setAction("idle"), 2400);
    }, 1500);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });
}

// ---------- Self 开关 ----------
function setupSelf() {
  const toggle = document.getElementById("selfToggle");
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    notifyPet(toggle.checked ? "idle" : "hidden");
  });
}

// ---------- 窗口控制 ----------
function setupWinControls() {
  const min = document.getElementById("winMin");
  const close = document.getElementById("winClose");
  if (!min && !close) return;
  import("@tauri-apps/api/window")
    .then((win) => {
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
