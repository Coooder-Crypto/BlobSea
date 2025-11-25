# BlobSea Documentation

## Overview
BlobSea is an agent-ready data marketplace built on Walrus + Sui. Creators encrypt locally (AES-GCM), upload blobs to Walrus, and mint listings/licenses on Sui. Buyers or agents pay on-chain, receive a license NFT with the encrypted key, and the SDK/CLI handles download + decrypt.

Use this docs space to:
- Understand the architecture and cryptography choices.
- Spin up the frontend and CLI/SDK locally.
- See how Move contracts, Walrus uploads, and UI fit together.
- Track the HTTP 402 (agent economy) roadmap.

## Architecture (high level)
- Encrypt once: Browser/CLI does AES-GCM (nonce + filename) → Walrus manifest + content hash.
- List on Sui: `marketplace::create_listing` stores manifest/key/price; events expose metadata.
- License-based access: purchase mints a license NFT carrying the encrypted key package.
- SDK/CLI automation: `BlobSeaAgent` (TS) and `@blobsea/cli` mirror the web flow.

## Quick Start (frontend)
1) `cd frontend && pnpm install`
2) Set `.env`:
   - `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID`
   - `NEXT_PUBLIC_MARKETPLACE_ID`
   - `NEXT_PUBLIC_WALRUS_GATEWAY` / `NEXT_PUBLIC_WALRUS_BLOB_BASE` (optional)
3) `pnpm dev` and open `http://localhost:3000`
4) Connect a Sui wallet (testnet) to list or buy.

## Quick Start (CLI / SDK)
1) `cd sdk && pnpm install && pnpm build`
2) Create `blobsea.config.json` with Walrus + Sui params.
3) Common commands:
   ```bash
   blobsea-cli encrypt ./data.bin --manifest ./out/manifest.json
   blobsea-cli upload ./data.bin --config ./blobsea.config.json
   blobsea-cli listing create ./out/manifest.json --price 1.5
   blobsea-cli license download <LICENSE_ID> --out ./dataset.bin
   ```

## Key Flows (Mermaid)
See `../BLOBSEA_DECK_FLOWS.md` for ready-to-use diagrams (global flow, cryptography, key management, contracts, agent state, HTTP 402 timeline).

## HTTP 402 / Agent Vision
- Structured metadata for agent discovery.
- License as capability; future expiry/usage limits.
- Hooks reserved for HTTP 402 pay-per-request; roadmap in Slide 12 diagram.

## Directories
- `frontend/` Next.js app (market, sell, inventory, favicon) using pixel UI.
- `sdk/` TypeScript CLI (`@blobsea/cli`) for Walrus + Sui automation.
- `move/` Sui Move marketplace module.
- `docs/` This documentation; `BLOBSEA_DECK_FLOWS.md` for diagrams.

## Links
- Repo: https://github.com/coooder/BlobSea
- CLI/SDK: `@blobsea/cli` (v0.1.0-beta)
