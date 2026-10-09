// 悬浮球桌宠逻辑（独立透明窗口）
// - 动作帧切换（idle/wave/deliver/think）
// - 点击球弹出动作菜单
// - 监听主窗口事件：typing → Think；working → Think 持续；deliver → Deliver

const FRAMES = {
  idle: "/assets/chibi-idle.png",
  wave: "/assets/chibi-wave.png",
  deliver: "/assets/chibi-deliver.png",
  think: "/assets/chibi-think.png",
};

const BUBBLES = {
  deliver: "A letter for you.",
  think: "Hmm…",
};

let current = "idle";

function setAction(action, { silent = false } = {}) {
  current = action;
  const img = document.getElementById("petImg");
  const ball = document.querySelector(".ball");
  if (img && FRAMES[action]) img.src = FRAMES[action];
  if (ball) ball.dataset.action = action;
  document.querySelectorAll(".menu-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.action === action);
  });
  const bubble = document.getElementById("bubble");
  if (!silent && bubble && BUBBLES[action]) {
    bubble.textContent = BUBBLES[action];
    bubble.classList.remove("hidden");
    clearTimeout(bubble._t);
    bubble._t = setTimeout(() => bubble.classList.add("hidden"), 2200);
  } else if (bubble && !BUBBLES[action]) {
    bubble.classList.add("hidden");
  }
}

// 点击球 ↔ 菜单
function setupMenu() {
  const ball = document.querySelector(".ball");
  const menu = document.getElementById("menu");
  if (!ball || !menu) return;
  ball.addEventListener("click", (e) => {
    // 拖拽结束瞬间的 click 会被过滤（简单处理：菜单切换）
    menu.classList.toggle("hidden");
  });
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setAction(btn.dataset.action);
      menu.classList.add("hidden");
    });
  });
}

// 监听主窗口事件（打字/连接/完成）
async function setupEvents() {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen("chibi:typing", () => setAction("think"));
    await listen("chibi:working", () => setAction("think"));
    await listen("chibi:deliver", () => setAction("deliver"));
    await listen("chibi:idle", () => setAction("idle"));
    await listen("chibi:wave", () => setAction("wave"));
  } catch (e) {
    console.info("非 Tauri 环境，跳过事件监听", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setAction("idle", { silent: true });
  setupMenu();
  setupEvents();
});
