# @blobsea/cli

A lightweight command-line toolkit for BlobSea builders. The CLI offers a single entry point to future Walrus/Sui workflows, letting you script uploads, manifest generation, and (eventually) on-chain interactions without depending on the main Next.js app.

> **Status:** experimental scaffold. Commands currently surface configuration + sanity checks so you can integrate the package into other automation flows while the full feature set is being built.

## Installation

```bash
pnpm add -D @blobsea/cli
# or
yarn add -D @blobsea/cli
# or
npm install --save-dev @blobsea/cli
```

## Usage

```bash
# 查看可用指令
blobsea-cli --help

# 本地加密文件并生成 manifest + payload
blobsea-cli encrypt ./path/to/data.bin \
  --terms ./terms.pdf \
  --manifest ./out/manifest.json \
  --payload ./out/payload.blob

# 加密并尝试上传 Walrus（默认把 manifest/payload 写到文件，同时发起 HTTP POST）
blobsea-cli upload ./path/to/data.bin \
  --config ./blobsea.config.json \
  --endpoint https://publisher.walrus-testnet.walrus.space/v1/blobs

# 查看当前配置
blobsea-cli config --config ./blobsea.config.json

# Listing 占位命令（后续会接入 Move 交易）
blobsea-cli listing create ./out/manifest.json
blobsea-cli listing list

# License 列表与下载
blobsea-cli license list
blobsea-cli license download <LICENSE_ID> --out ./dataset.bin
```

Add a `blobsea.config.json` next to where you run the CLI:

```json
{
  "walrusGateway": "https://publisher.walrus-testnet.walrus.space",
  "walrusBlobBase": "https://aggregator.walrus-testnet.walrus.space",
  "marketplacePackageId": "0x...",
  "marketplaceId": "0x...",
  "suiRpcUrl": "https://fullnode.testnet.sui.io",
  "suiPrivateKey": "<base64_or_hex_private_key>"
}
```

If you prefer environment variables, create a `.env` file in the working directory:

```
BLOBSEA_WALRUS_GATEWAY=https://publisher.walrus-testnet.walrus.space
BLOBSEA_WALRUS_BLOB_BASE=https://aggregator.walrus-testnet.walrus.space
BLOBSEA_MARKETPLACE_PACKAGE_ID=0x...
BLOBSEA_MARKETPLACE_ID=0x...
BLOBSEA_SUI_RPC_URL=https://fullnode.testnet.sui.io
BLOBSEA_SUI_PRIVATE_KEY=<private_key>
```

Run `pnpm dev` inside this package to develop iteratively, or `pnpm build` to produce `dist/index.js` which is wired to the `blobsea-cli` binary.

## Roadmap

- [x] 本地 AES-GCM 加密 + manifest/payload 输出。
- [ ] 接入 Walrus 上传接口并返回 blobId。
- [ ] 衔接 Move 交易（create listing / purchase）。
- [ ] License 下载与解密辅助命令。
- [ ] CI/Agent 模板脚本。

PRs welcome!
