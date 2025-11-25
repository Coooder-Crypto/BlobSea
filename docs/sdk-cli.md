# SDK & CLI

## Overview
`@blobsea/cli` provides a scriptable Walrus + Sui workflow identical to the web app. It’s pure TypeScript (no React/Next), suitable for CI and agents.

## Install & Build
```bash
cd sdk
pnpm install
pnpm build   # or pnpm dev -- --help
```

## Config
Create `blobsea.config.json` or `.env` with:
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

## Commands
- `blobsea-cli encrypt <file> --manifest ./out/manifest.json --terms ./terms.pdf`
- `blobsea-cli upload <file> --config ./blobsea.config.json`
- `blobsea-cli listing create ./out/manifest.json --price 1.5`
- `blobsea-cli listing list`
- `blobsea-cli license list`
- `blobsea-cli license download <LICENSE_ID> --out ./dataset.bin`

## Flow Examples
- **Sell**: encrypt → upload → `listing create` → confirm events.
- **Buy/Agent**: `license download` to fetch + hash-verify + decrypt using the licence key.

## SDK (TS)
- `BlobSeaAgent` (in landing snippet) initializes with `suiNetwork` + `keypair`.
- Methods: `marketplace.buy(...)` → returns licence → `license.download()` handles fetch + decrypt.
- Install: `npm install @blobsea/sdk` (v0.1.0-beta).

## Notes
- Uses Walrus hash (sha3_256) for integrity; licence holds key package.
- 402 hooks planned: pay-per-request, billing registry, agent automation.
