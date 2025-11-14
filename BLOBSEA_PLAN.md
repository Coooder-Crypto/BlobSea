# BlobSea 全局计划（不含 x402）

> Walrus + Sui 数据市场，当前专注于“客户端加密 → Walrus 上传 → 链上上架/许可证 → 下载解密”的最小可用版本，暂不接入 x402。未来若官方发布稳定 SDK，再扩展支付通道。

## 阶段路线
1. **架构 & 需求（已完成）**  
   - 角色/流程：卖家本地加密 → Walrus 上传 → Move 上架 → 买家支付 → License + Capability → 下载解密。  
   - 文档：`STAGE1_PLAN.md`、`STAGE2_MOVE.md`、`STAGE3_WALRUS.md` 提供设计基线。

2. **链上合约（进行中）**  
   - `blobsea::marketplace` 骨架已写，支持直接 SUI 支付、对象设计/事件。  
   - 下一步：完善字段（有效期、license 选项）、单元测试、集成交易脚本。  
   - 接口预留 `PaymentMethod`，但暂仅实现 `DirectSui`。

3. **Walrus 加密 & 上传（进行中）**  
   - CLI 与 Next.js 前端都能执行 AES-GCM + SHA3-256，加密后调用 `/api/walrus/upload` PUT 到 Walrus Publisher，并生成 manifest（含 `blobId`、`hash`、`suiBlobObjectId`、密钥等）；前端 `ListingCreator` 可直接使用 manifest 上架。  
   - 下载/解密：Next API 代理 aggregator，`pnpm download:decrypt` 可验证密文。  
   - 待办：加入更完善的错误提示、上传进度、断点续传。

4. **前端 dApp（进行中）**  
   - 已切换到 Next.js App Router，提供 Seller 上传器、Listing 上架、Listing 列表 + 购买、License 清单等模块。  
   - 计划扩展：  
     - 上架表单：读取 manifest 自动生成 Move `create_listing` 交易。  
     - Buyer 视图：展示 Listing，调用 `purchase_listing`，显示 License。  
     - 下载助手：基于 License 对象调用代理下载，并校验/解密。

5. **支撑服务（待做）**  
   - 事件索引器/搜索（监听 `ListingCreated` 等，写入数据库供前端查阅）。  
   - Walrus 代理增强：加入 License/签名验证、缓存策略、健康监控。  
   - 仲裁/撤销 API：允许卖家/运营方处理申诉。

6. **测试 & 部署（待做）**  
   - Move 单元测试 + e2e 测试（上架→购买→下载）。  
   - Next API/前端单测与集成测试。  
   - 部署 Sui 测试网 / 主网，配置 Walrus 节点。

## 设计注意事项
- **x402 推迟**：现阶段不集成 x402；所有支付路径默认使用 SUI 直接支付。保留 `PaymentMethod` 枚举与支付抽象，待官方 SDK 发布后再扩展。  
- **客户端加密优先**：链上与 Walrus 不存明文；密钥只在 manifest/License 中处理，License 可被撤销。  
- **send_object_to**：前端上传支持 `send_object_to=<wallet>`，获取链上 Blob 对象，便于后续索引/确权。  
- **Manifest 对齐**：CLI 与前端生成的 manifest 结构保持一致，便于脚本/前端/后端互通。  
- **扩展预留**：在 Move 与前端接口中保留 `payment_metadata`、`PaymentProvider` 等抽象，为未来支付或 Agent 接入铺路。

## 近期优先级
1. **Move 合约完善**：补充 `create_listing`/`purchase_listing` 流程，增加单元测试。  
2. **前端上架表单**：让卖家可以直接从 manifest 调用 Move 交易，完成上链。  
3. **Listing 展示与购买**：在前端拉取链上数据，完成购买流程与 License 展示。  
4. **下载助手**：基于 License 调用 Walrus 代理，完成校验解密。  
5. **文档同步**：将新流程写入 README/Stage 文档，指导用户从上传到链上完整操作。
