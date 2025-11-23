# BlobSea

BlobSea 是一个围绕 Sui Move 合约与 Walrus 去中心化存储打造的数据市场 MVP。卖家可以在浏览器中完成数据加密上传，随后一键把 manifest 写入链上创建 Listing，买家购买 License 后立刻通过前端校验证书并解密下载原始文件。

## 核心特性
- **端到端加密上传**：前端使用 AES-GCM 将文件加密（含 nonce、文件名等元信息），然后通过 Next.js API 代理上传至 Walrus 发布者节点，避免暴露私有数据。
- **链上 Listing 与 License**：Move 合约 `blobsea::marketplace` 管理市场、Listing、License，事件内包含 `name`/`description`/Walrus Hash 等字段，前端可据此渲染详情与校验。
- **一体化卖家流程**：`ListingCreator` 将 Walrus 上传与 `create_listing` 交易合并，卖家只需填写名称、价格、描述即可创建 Listing；高级设置支持 Epoch、Permanent、`send_object_to` 等 Walrus 参数。
- **跨端下载与校验**：买家在 `LicenseInventory` 中下载 license key，前端从 Walrus 代理获取 blob、校验哈希（提示而非中断），解密后复原为上传时的原始文件名。
- **React Query + Mysten dapp-kit**：监听链上 Listing/License 事件，自动刷新列表，且提供交易签名、Sui Explorer 链接等反馈。

## 目录结构
```
BlobSea/
├─ move/                    # Move package，包含 marketplace 合约
├─ frontend/                # Next.js + Radix UI 前端
│  ├─ app/api/walrus/*      # Walrus 上传/下载代理
│  ├─ components/           # BlobSeaApp、ListingCreator、ListingGallery 等
│  └─ lib/                  # bytes、walrus 工具、网络配置
├─ sdk/                     # @blobsea/cli，纯 CLI 的 Walrus + Sui 工具链
├─ STAGE*.md                # 项目阶段性规划
└─ README.md
```

## 本地运行
1. **准备依赖**
   - Node.js 18+，pnpm 8+
   - Sui CLI（1.60+）已连接测试网，并且账户内有 SUI 用于部署
   - Walrus 测试网默认使用官方 publisher/aggregator，无需自建节点

2. **配置环境变量**
   - 复制 `frontend/.env.example` → `frontend/.env`，根据需求覆写：
     - `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID`、`NEXT_PUBLIC_MARKETPLACE_ID`：发布合约后的包地址与 Marketplace 对象
     - `WALRUS_GATEWAY`、`WALRUS_BLOB_BASE`：如需使用自建 Walrus endpoint 可替换

3. **部署 Move 合约**
   ```bash
   cd move
   sui client publish . --gas-budget 40000000
   sui client call \
       --package <NEW_PACKAGE> \
       --module marketplace \
       --function publish_marketplace \
       --args <TREASURY_ADDRESS> <FEE_BPS> \
       --gas-budget 100000000
   ```
   记录输出中的 `PackageID` 与新生成的 `Marketplace` 共享对象 ID，回填到 `.env`。

4. **启动前端**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
   默认运行在 `http://localhost:3000`，连接测试网钱包（如 Sui Wallet、Ethos）即可体验上传/购买流程。

## CLI / SDK 使用
项目内置了一个纯 CLI 包 `sdk/`（`@blobsea/cli`），可在本地或 CI 环境完成与网站相同的 Walrus + Sui 操作，便于自动化上传、上架、下载：

1. **安装依赖并构建**
   ```bash
   cd sdk
   pnpm install
   pnpm build
   # 或 pnpm dev -- --help 直接查看指令
   ```

2. **准备配置**
   - 在 CLI 工作目录下创建 `blobsea.config.json` 或 `.env`，写入 Walrus gateway、aggregator、Marketplace IDs、Sui RPC 与私钥等信息。例如：
     ```json
     {
       "walrusGateway": "https://publisher.walrus-testnet.walrus.space",
       "walrusBlobBase": "https://aggregator.walrus-testnet.walrus.space",
       "marketplacePackageId": "0x...",
       "marketplaceId": "0x...",
       "suiRpcUrl": "https://fullnode.testnet.sui.io",
       "suiPrivateKey": "suiprivkey..."
     }
     ```

3. **常用命令**
   ```bash
   # 查看指令
   blobsea-cli --help

   # 本地加密文件并生成 manifest/payload
   blobsea-cli encrypt ./path/to/data.bin \
     --terms ./terms.pdf \
     --manifest ./out/manifest.json \
     --payload ./out/payload.blob

   # 加密 + 上传 Walrus（会更新 manifest 中的 blobId/hash）
   blobsea-cli upload ./path/to/data.bin \
     --config ./blobsea.config.json \
     --endpoint https://publisher.walrus-testnet.walrus.space/v1/blobs

   # 链上上架 Listing（调用 Move create_listing）
   blobsea-cli listing create ./out/manifest.json --price 1.5

   # 查看链上最新 Listing 事件
   blobsea-cli listing list

   # 查看某钱包持有的 License
   blobsea-cli license list

   # 根据 License 下载并解密 Walrus Blob
   blobsea-cli license download <LICENSE_ID> --out ./dataset.bin

   # 检查当前配置
   blobsea-cli config --config ./blobsea.config.json
   ```

4. **工作流示例**
   - 通过 `encrypt` 生成 manifest + payload → `upload` 推 Walrus → `listing create` 写链上 → `listing list` 验证事件。
   - 买家或自动化 Agent 可使用 `license download` 命令，通过 License ID 直接把 Walrus Blob 拉回本地、校验哈希并解密，还原为上传时的原始文件。

CLI 完全独立于前端运行，适合在 CI、脚本或其他系统中复用 BlobSea 的核心能力。欢迎根据具体需求拓展更多命令或脚本。

## 402 & Agent 愿景
BlobSea 的长期愿景是做「程序可访问的数据市场」。结合 HTTP 402 Payment Required 的理念，我们希望把 Walrus + Sui 组合成一套可被自动化代理访问的 402 数据 API：

1. **Deterministic Metadata**：Listing 结构已经包含 `name`、`description`、Walrus Hash、许可条款哈希等字段，后续可扩展出 `category`、`schema` 等描述，让 Agent 能够在链上自助检索并理解数据。
2. **License as Capability**：License 对象既是加密密钥容器，也是访问权限证明。未来可在合约中加入时间/使用次数限制（option 字段已预留），方便 402 API 判断是否需要续费。
3. **Agent Purchase Flow**：借助 dapp-kit 或 Replayable Transaction Blocks，Agent 能够：
   - 监控链上 Listing 事件 → 根据 `terms_hash` 判断是否符合策略
   - 自动生成支付交易 → 获取 License → 读取 Walrus Blob（前端已有 REST 代理，可扩展为公开 API）
   - 将解密后的数据馈送至本地模型/工具链
4. **402 触发点**：可在 Next.js API 层加入「无 License 则返回 402」的响应，并附带需要签名的信息，让人类或 Agent 自动跳转到支付/签名流程。

## 未来路线图
- **Listing metadata 扩展**：引入 `category`、`data_format` 等结构化字段，为 Agent/402 API 提供机器可解析的 catalog。
- **链上许可策略**：灵活设置过期时间、下载次数、授权范围，必要时支持合规审计。
- **Agent SDK**：封装 Walrus 下载、哈希校验、解密流程，并提供 402 错误处理、自动补购等逻辑，让 Agent 可嵌入任意数据处理 pipeline。
- **可验证执行**：结合 zkWASM / zkVM 或 Walrus 的证明机制，保障链下代理下载的数据未被篡改，解决「Walrus 哈希不匹配」这类告警的追溯。

欢迎基于当前 MVP 继续迭代，打造真正面向 Agent 经济的 402 数据市场。
