# Violet Agent — 运行指南

从克隆到看到薇尔莉特窗口的完整步骤。

## macOS（推荐）

### 0. 安装环境（一次性）
```bash
# Xcode 命令行工具（提供编译所需的工具链）
xcode-select --install

# Rust（rustup）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# 安装后重开终端，使 cargo 生效
rustc --version && cargo --version   # 验证

# Node.js（推荐用 Homebrew，或用官网安装包）
brew install node   # 或从 https://nodejs.org 装 LTS
node --version && npm --version       # 验证

# Git
xcode-select --install   # 已含 git；或 brew install git
git --version
```

### 1. 克隆仓库
```bash
git clone https://github.com/simlerick/violet-agent.git
cd violet-agent
```

### 2. 前端依赖
```bash
cd src && npm install && cd ..
```

### 3. 运行（Tauri 窗口）
```bash
cargo run
```
> 首次运行会编译 Tauri 及依赖，需数分钟；编译完成后弹出 Violet Agent 窗口（M0 为占位页 + 本地钱包健康检查）。

### 4. 开发模式（热重载，推荐）
```bash
cargo tauri dev
```
前端改动自动刷新，Rust 改动自动重编译。

### 5. 打包发布（M4 阶段）
```bash
cargo tauri build     # 生成 .dmg / .app
```

---

## Windows

### 环境安装
- **Rust**：安装 [rustup](https://rustup.rs)
- **Node.js**：LTS 安装包
- **Git**：安装包
- **链接器**：Windows 需要 MSVC（Visual Studio C++ Build Tools）或 GNU（MSYS2 + MinGW-w64）。Tauri 官方推荐 **MSVC**。

### ⚠️ 关键问题：智能应用控制（Smart App Control）
若 Windows 开启了「智能应用控制」，它会**阻止运行 Rust 编译出的无签名程序**（报错 `os error 4551`），导致 `cargo build` 无法完成。

处理选项：
1. **关闭智能应用控制**（Windows 安全中心 → 应用和浏览器控制 → 智能应用控制 → 关闭）。⚠️ 此操作**不可逆**，关闭后无法再开启（除非重装系统）。
2. **不改系统**：依赖 **GitHub CI** 云端验证编译（见下文），本地只写代码、推送，由 CI 把关。
3. **使用 MSVC + 已签名/信任**：部分环境配置可规避，但最稳妥是上面两条。

---

## GitHub CI 云端验证（不依赖本机工具链）

仓库已含 `.github/workflows/ci.yml`：每次 push / PR 到 `main` 都会在 GitHub 云端执行 `cargo check`，验证 Rust 代码可编译。你本地只负责写代码、推送，编译正确性由 CI 保证——**这是不改本机系统也能持续验证的最佳路径**。

---

## 常见问题

| 现象 | 处理 |
|---|---|
| `cargo: command not found` | 重开终端；或 `source ~/.cargo/env` |
| `link.exe not found` | Windows 缺 C++ 工具链，装 MSVC Build Tools 或切 GNU |
| `os error 4551` | Smart App Control 拦截，见上 |
| 前端改了不生效 | 用 `cargo tauri dev`（热重载） |
| 端口被占用 | vite 固定 1420 端口，关闭占用进程 |
