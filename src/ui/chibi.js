// 桌宠（无背景 Q 版）逻辑
// - 点击角色 → 聊天面板
// - 预置聊天回复（M0 伪 LLM，M1 接真 LLM）
// - 监听主窗口事件：typing/working → Think；deliver → Deliver；idle/wave → 对应动作

const FRAMES = {
  idle: "/assets/chibi-idle.png",
  wave: "/assets/chibi-wave.png",
  deliver: "/assets/chibi-deliver.png",
  think: "/assets/chibi-think.png",
};

const REPLIES = [
  { match: /hello|hi|hey/i, reply: "Hello. How may I be of service?" },
  { match: /wallet|balance|money/i, reply: "Your wallet is awaiting setup. I keep your keys local-only." },
  { match: /trade|buy|sell|solana/i, reply: "Trading will arrive with the Solana module. I will prepare the letter." },
  { match: /help|what can you/i, reply: "I take orders, watch your balance, and deliver letters. More powers are being written." },
  { match: /who are you/i, reply: "I am an Auto Memory Doll. I write the words your heart cannot say." },
];

let current = "idle";
let chatOpen = false;

function setAction(action, { silent = false } = {}) {
  current = action;
  const img = document.getElementById("petImg");
  const stage = document.querySelector(".pet-stage");
  if (img && FRAMES[action]) img.src = FRAMES[action];
  if (stage) stage.dataset.action = action;
  const bubble = document.getElementById("bubble");
  if (!silent && bubble) {
    const text = action === "deliver" ? "A letter for you." : action === "think" ? "Hmm…" : "";
    if (text) {
      bubble.textContent = text;
      bubble.classList.remove("hidden");
      clearTimeout(bubble._t);
      bubble._t = setTimeout(() => bubble.classList.add("hidden"), 2000);
    } else {
      bubble.classList.add("hidden");
    }
  }
}

// ---------- 聊天 ----------
function toggleChat(force) {
  const chat = document.getElementById("chat");
  if (!chat) return;
  chatOpen = typeof force === "boolean" ? force : !chatOpen;
  chat.classList.toggle("hidden", !chatOpen);
  if (chatOpen) {
    document.getElementById("chatInput").focus();
  }
}

function addMsg(text, who) {
  const log = document.getElementById("chatLog");
  if (!log) return;
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function reply(input) {
  const text = input.trim();
  if (!text) return;
  addMsg(text, "me");
  setAction("think", { silent: true });
  const hit = REPLIES.find((r) => r.match.test(text));
  setTimeout(() => {
    addMsg(hit ? hit.reply : "I will note that in a letter. (M1 will bring my full voice.)", "violet");
    setAction("deliver", { silent: true });
    setTimeout(() => setAction("idle", { silent: true }), 2200);
  }, 900);
}

function setupChat() {
  const stage = document.querySelector(".pet-stage");
  const closeBtn = document.getElementById("chatClose");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  if (stage) stage.addEventListener("click", () => toggleChat());
  if (closeBtn) closeBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleChat(false); });
  if (send) send.addEventListener("click", () => { reply(input.value); input.value = ""; });
  if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") { reply(input.value); input.value = ""; } });
}

// ---------- 主窗口事件 ----------
async function setupEvents() {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen("chibi:typing", () => setAction("think"));
    await listen("chibi:working", () => setAction("think"));
    await listen("chibi:deliver", () => setAction("deliver"));
    await listen("chibi:wave", () => setAction("wave"));
    await listen("chibi:idle", () => setAction("idle"));
    await listen("chibi:hidden", () => toggleChat(false));
  } catch (e) {
    console.info("非 Tauri 环境，跳过事件监听", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setAction("idle", { silent: true });
  setupChat();
  setupEvents();
});
