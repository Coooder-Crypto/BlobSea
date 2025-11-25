# Getting Started

## Prerequisites
- Node.js ≥ 18 and PNPM ≥ 8
- Sui CLI 1.60+ on testnet with SUI funds
- Walrus publisher/aggregator (defaults to official testnet endpoints)

## Frontend
1) `cd frontend && pnpm install`
2) Copy `.env.example` → `.env` and fill:
   - `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID`
   - `NEXT_PUBLIC_MARKETPLACE_ID`
   - `NEXT_PUBLIC_WALRUS_GATEWAY`, `NEXT_PUBLIC_WALRUS_BLOB_BASE` (optional override)
3) Run `pnpm dev` → open `http://localhost:3000`
4) Pages: `/` hero + features, `/market` listings, `/sell` creator workspace, `/inventory` licenses.

## Move (deploy)
```bash
cd move
sui client publish . --gas-budget 40000000
sui client call \
  --package <NEW_PACKAGE_ID> \
  --module marketplace \
  --function publish_marketplace \
  --gas-budget 100000000 \
  --args <TREASURY_ADDRESS> <FEE_BPS>
```
Place the package id + Marketplace object id into `.env`.

## CLI / SDK
1) `cd sdk && pnpm install && pnpm build`
2) Create `blobsea.config.json`:
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
3) Commands:
```bash
blobsea-cli encrypt ./data.bin --manifest ./out/manifest.json
blobsea-cli upload ./data.bin --config ./blobsea.config.json
blobsea-cli listing create ./out/manifest.json --price 1.5
blobsea-cli listing list
blobsea-cli license download <LICENSE_ID> --out ./dataset.bin
```

## Useful Links
- Architecture Mermaid: `../BLOBSEA_DECK_FLOWS.md`
- Raw diagram: `frontend/public/blobsea-architecture.mmd`
- Repo: https://github.com/coooder/BlobSea
