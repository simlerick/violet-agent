# Violet Agent 🌸

> **ヴァイオレット / 紫罗兰永恒花园 · 薇尔莉特·伊芙加登 风格化致敬**

**链上交易 AI Agent + 子母钱包管理系统** —— 冷静、精准、忠于指令，替你执行每一次决策，绝不自作主张。

## 项目一句话
**你说买什么，薇尔莉特用她的钱包去执行；你说止损，薇尔莉特盯着。而她花的每一分钱，都来自你给她的授权。**

- **主链**：Solana
- **交易标的**：美股 / 港股 RWA 代币（链上代币化股票，如 Backed 类 tokenized equities）
- **形态**：macOS（.dmg）+ Windows（.exe）桌面应用
- **定位**：非商用、纯热爱、全开源（致敬风格化形象，非盗用版权）

---

## 3 分钟跑起来（占位，待 M0 完成后填充）
```bash
# 0. 环境要求：Rust 1.75+ / Node 18+ / Git
# 1. 克隆
git clone https://github.com/<your>/violet-agent.git && cd violet-agent
# 2. 前端依赖
cd src && npm install
# 3. 运行（Tauri）
cd .. && cargo run
```
> ⚠️ 当前处于 **M0 地基**阶段，骨架与文档已就位，可编译代码随里程碑填充。

---

## 核心特性
| 模块 | 说明 |
|---|---|
| 🧾 **子母钱包** | 母钱包＝主人掌控（主权）；子钱包＝你转账后 100% 使用权给 Violet 执行；可撤权、可更换绑定 |
| 💬 **自然语言对话** | `买入 SOL 价值 500 USDC` / `给子钱包转账 1000 USDC` / `把 BTC 止损设在 60k` |
| 📊 **可视化流水** | 交易记录、余额、盈亏曲线、资产分布、子母往来 |
| 🛡️ **止损 / 风控** | 条件单、单笔限额、地址白名单、滑点保护 |
| 🔐 **本地安全** | 助记词本地生成（BIP39）+ 私钥本地加密（Argon2id + XChaCha20），永不上云 |
| 🌸 **薇尔莉特形象** | UI 右侧立绘 + 桌宠（P1） |

---

## 目录结构
```
violet-agent/
├── docs/                 # 文档（架构、安全、计划书）
│   ├── violet-plan.md    # 项目计划书
│   ├── ARCHITECTURE.md   # 技术架构
│   └── SECURITY.md       # 安全白皮书
├── src-tauri/            # Tauri / Rust 后端
│   ├── src/
│   │   ├── wallet/       # 子母钱包模块
│   │   ├── agent/        # LLM 编排 + 意图解析
│   │   ├── risk/         # 风控模块
│   │   └── monitor/      # 链上监控
│   ├── capabilities/
│   └── icons/
├── src/                  # 前端（Svelte/React）
│   └── ui/
│       ├── components/
│       ├── assets/
│       └── styles/
└── .github/workflows/    # CI
```

---

## 里程碑（Roadmap）
- [x] **M0** 地基：项目骨架 + 文档（进行中）
- [ ] **M1** 能对话：LLM 接入 + 意图解析 + 薇尔莉特立绘初版
- [ ] **M2** 能交易：Jupiter / Solana RWA DEX 执行 + 流水可视化
- [ ] **M3** 能风控：止损 + 限额 + 撤权回收
- [ ] **M4** 打磨发布：完整视觉 + 桌宠 + 打包 dmg/exe + Release

---

## 安全声明
> 本项目托管真实资产，安全是上线前提。详见 [docs/SECURITY.md](docs/SECURITY.md)。
> 本项目为工具性开源软件，**非投资顾问，不构成任何投资建议**。

## License
[MIT](LICENSE)

> 视觉形象为《紫罗兰永恒花园》风格化致敬，非商用、纯热爱、全开源；不包含任何受版权保护的官方立绘素材。
