// Violet Agent — M1：对话（LLM 网关 + 本地规则兜底）
// - 视图切换（Chat/Wallet/Portfolio/Orders/Settings/Mother Key）
// - Chat 面板：发送消息 → Rust llm_chat（OpenAI 兼容 API，Deepseek 默认）
// - 无 API key 时自动降级为本地关键词回复

const I18N = {
  en: {
    btnZh: "中文",
    navChat: "Chat",
    navWallet: "Wallet",
    navPortfolio: "Portfolio",
    navOrders: "Orders",
    navSettings: "Settings",
    navMother: "Mother Key",
    chatPlaceholder: "message Violet…",
    chatSend: "Send",
    sysReady: "Violet Agent ready — M1 chat online",
    sysNoKey: "No LLM API key configured. Set VIOLET_LLM_API_KEY to enable the real model (Deepseek / OpenAI-compatible). Using local replies.",
    phPortfolio: "Portfolio · on-chain · M3",
    phOrders: "Orders · trading · M4",
    phSettings: "Settings · coming soon",
    phMother: "Mother Key · local-only · BIP39",
    secConn: "LLM Connection",
    secLang: "Language",
    secSkills: "Skills",
    fBaseUrl: "Base URL",
    fModel: "Model",
    fApiKey: "API Key",
    fLang: "Interface",
    btnSave: "Save",
    btnTest: "Test connection",
    keyNotSet: "not set",
    keySet: "configured: ",
    connOk: "Connection OK",
    connFail: "Failed",
    saved: "Saved ✓",
    langSaved: "Language saved ✓",
  },
  zh: {
    btnZh: "中文",
    navChat: "对话",
    navWallet: "钱包",
    navPortfolio: "持仓",
    navOrders: "指令",
    navSettings: "设置",
    navMother: "母钱包",
    chatPlaceholder: "给薇尔莉特写信…",
    chatSend: "发送",
    sysReady: "Violet Agent 已就绪 — M1 对话在线",
    sysNoKey: "未配置 LLM API Key。设置 VIOLET_LLM_API_KEY 可启用真实模型（Deepseek / OpenAI 兼容）。当前使用本地回复。",
    phPortfolio: "持仓 · 链上 · M3 上线",
    phOrders: "指令 · 交易 · M4 上线",
    phSettings: "设置 · 即将上线",
    phMother: "母钱包 · 仅本地 · BIP39",
    secConn: "LLM 连接",
    secLang: "语言",
    secSkills: "技能",
    fBaseUrl: "接口地址",
    fModel: "模型",
    fApiKey: "API Key",
    fLang: "界面语言",
    btnSave: "保存",
    btnTest: "测试连接",
    keyNotSet: "未设置",
    keySet: "已配置: ",
    connOk: "连接成功",
    connFail: "连接失败",
    saved: "已保存 ✓",
    langSaved: "语言已保存 ✓",
  },
};

let currentLang = "en";

function t(key) {
  return I18N[currentLang][key] ?? I18N.en[key];
}

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key && I18N[currentLang][key]) el.textContent = I18N[currentLang][key];
  });
  const btn = document.getElementById("langBtn");
  if (btn) btn.textContent = currentLang === "en" ? I18N.en.btnZh : I18N.en.btnZh;
  const input = document.getElementById("chatInput");
  if (input) input.placeholder = t("chatPlaceholder");
}

// ---------- 视图切换 ----------
const VIEWS = ["chat", "wallet", "portfolio", "orders", "settings", "mother"];

function switchView(key) {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.key === key);
  });
  VIEWS.forEach((v) => {
    const el = document.getElementById(`view${v[0].toUpperCase()}${v.slice(1)}`);
    if (el) el.classList.toggle("hidden", v !== key);
  });
  if (key === "wallet") pingKeystore();
  if (key === "settings") loadSettings();
}

// ---------- 设置 ----------
const SKILLS = [
  { id: "keystore", name: "keystore", desc: "M0 · local keys · argon2id + BIP39 (planned)", on: true },
  { id: "llm-chat", name: "llm-chat", desc: "M1 · OpenAI-compatible gateway (Deepseek) + local fallback", on: true },
  { id: "on-chain", name: "on-chain", desc: "M3 · Solana read-only (balances / portfolio)", on: false },
  { id: "trading", name: "trading", desc: "M4 · DEX swaps + stop-loss (mother/sub-wallet)", on: false },
  { id: "pet", name: "pet", desc: "removed for now · will return as Q-version companion", on: false },
];

function renderSkills() {
  const list = document.getElementById("skillList");
  if (!list) return;
  list.innerHTML = "";
  SKILLS.forEach((s) => {
    const li = document.createElement("li");
    li.className = "skill-item";
    li.innerHTML = `
      <span class="skill-dot ${s.on ? "on" : "off"}"></span>
      <span class="skill-name">${s.name}</span>
      <span class="skill-desc">${s.desc}</span>`;
    list.appendChild(li);
  });
}

async function loadSettings() {
  renderSkills();
  const base = document.getElementById("cfgBaseUrl");
  const model = document.getElementById("cfgModel");
  const keyInput = document.getElementById("cfgApiKey");
  const keyState = document.getElementById("keyState");
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const s = await invoke("settings_get");
    if (base) base.value = s.llm_base_url || "";
    if (model) model.value = s.llm_model || "";
    if (keyInput) keyInput.value = "";
    if (keyState) {
      keyState.textContent = s.llm_api_key_masked
        ? `${t("keySet")}${s.llm_api_key_masked}`
        : t("keyNotSet");
    }
  } catch (e) {
    if (keyState) keyState.textContent = "browser preview";
  }
}

async function saveSettings() {
  const base = document.getElementById("cfgBaseUrl");
  const model = document.getElementById("cfgModel");
  const keyInput = document.getElementById("cfgApiKey");
  const status = document.getElementById("connStatus");
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    const res = await invoke("settings_save", {
      llmApiKey: keyInput ? keyInput.value.trim() : null,
      llmBaseUrl: base ? base.value.trim() : null,
      llmModel: model ? model.value.trim() : null,
      language: currentLang,
    });
    setConnStatus(res && res.ok ? t("saved") : `[err] ${res && res.reason}`, res && res.ok ? "ok" : "err");
    await loadSettings();
  } catch (e) {
    setConnStatus(`[err] ${e}`, "err");
  }
}

async function testConn() {
  const status = document.getElementById("connStatus");
  setConnStatus("testing…");
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    const r = await invoke("llm_ping");
    setConnStatus(r.ok ? `${t("connOk")} — ${r.detail}` : `${t("connFail")} — ${r.detail}`, r.ok ? "ok" : "err");
  } catch (e) {
    setConnStatus(`[err] ${e}`, "err");
  }
}

function setConnStatus(text, kind) {
  const status = document.getElementById("connStatus");
  if (!status) return;
  status.textContent = text;
  status.className = `conn-status ${kind === "ok" ? "ok" : kind === "err" ? "err" : ""}`;
}

function setupSettings() {
  const save = document.getElementById("cfgSave");
  const test = document.getElementById("cfgTest");
  if (save) save.addEventListener("click", saveSettings);
  if (test) test.addEventListener("click", testConn);

  const en = document.getElementById("cfgLangEn");
  const zh = document.getElementById("cfgLangZh");
  if (en) en.addEventListener("click", () => { applyLang("en"); persistLang(); });
  if (zh) zh.addEventListener("click", () => { applyLang("zh"); persistLang(); });
}

async function persistLang() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("settings_save", {
      llmApiKey: null,
      llmBaseUrl: null,
      llmModel: null,
      language: currentLang,
    });
  } catch (e) { /* browser preview */ }
}

// ---------- 聊天 ----------
let chatHistory = [];

function addMsg(role, text) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// 本地规则回复（无 key 兜底）
const LOCAL_REPLIES = [
  { re: /hello|hi|hey|你好|嗨/i, ans: "Hello, I'm Violet — your trading agent. Ask me about wallet, orders, or Solana." },
  { re: /wallet|钱包/i, ans: "Wallet module (M2) is planned: BIP39 mnemonic generated locally, sub-wallets derived from the master key. Nothing is stored on-chain yet." },
  { re: /trade|buy|sell|swap|交易|买|卖/i, ans: "Trading (M4) is planned: Solana DEX swaps + stop-loss, with a mother/sub-wallet model. Not live yet — stay tuned." },
  { re: /solana|sol/i, ans: "First chain is Solana. M3 adds read-only on-chain status; M4 adds actual transactions." },
  { re: /portfolio|持仓/i, ans: "Portfolio view (M3) will show your balances across sub-wallets on Solana." },
  { re: /who are you|你是谁|name/i, ans: "I am Violet Agent — an Auto Memory Doll for your on-chain life. Currently in M1: conversation." },
  { re: /help|帮助|可以做什么/i, ans: "I can chat now (M1). Next: local wallet (M2), on-chain read (M3), trading + stop-loss (M4), packaged app (M5)." },
];
function localReply(text) {
  for (const r of LOCAL_REPLIES) {
    if (r.re.test(text)) return r.ans;
  }
  return "I hear you. Real-model replies need VIOLET_LLM_API_KEY — once configured, I'll answer properly. (M1 local mode)";
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);
  send.disabled = true;

  chatHistory.push({ role: "user", content: text });
  const last6 = chatHistory.slice(-6);

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const res = await invoke("llm_chat", { messages: last6 });
    if (res && res.ok && res.content) {
      addMsg("agent", res.content);
      chatHistory.push({ role: "assistant", content: res.content });
    } else if (res && res.reason === "no_api_key") {
      const ans = localReply(text);
      addMsg("agent", ans);
      addMsg("sys", t("sysNoKey"));
    } else {
      const ans = localReply(text);
      addMsg("agent", ans);
    }
  } catch (e) {
    addMsg("agent", localReply(text));
    addMsg("sys", `[err] ${e}`);
  } finally {
    send.disabled = false;
    input.focus();
  }
}

// ---------- keystore 健康检查 ----------
async function pingKeystore() {
  const el = document.getElementById("healthJson");
  if (!el) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const health = await invoke("health");
    el.textContent = JSON.stringify(health);
  } catch (e) {
    el.textContent = "browser preview (no Tauri)";
  }
}

// ---------- 窗口控制 ----------
function setupWinControls() {
  const min = document.getElementById("winMin");
  const close = document.getElementById("winClose");
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

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => switchView(b.dataset.key));
  });
  switchView("chat");

  const send = document.getElementById("chatSend");
  const input = document.getElementById("chatInput");
  if (send) send.addEventListener("click", sendMessage);
  if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

  setupWinControls();
  setupSettings();
  addMsg("sys", t("sysReady"));
  addMsg("agent", "Hello — I'm Violet, your Auto Memory Doll. Ask me anything, or try wallet / trade / solana / help.");
});
