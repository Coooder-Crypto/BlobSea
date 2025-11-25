# BlobSea

BlobSea is an end-to-end data marketplace designed for agents. Creators encrypt any asset (datasets, private model weights, curated knowledge, internal telemetry) with AES-GCM, upload the blobs to Walrus, and mint programmable listings/licences on Sui. Buyers or autonomous agents discover listings, pay on-chain, receive a licence NFT that embeds the encrypted key package, and the SDK/CLI handles download + decryption automatically. All layers emit verifiable metadata so HTTP 402 style billing can plug in later.

---

## 1. System Overview

- **Encrypt once on Walrus** – the Browser/CLI performs AES-GCM (nonce + filename), produces a Walrus manifest + content hash, and optionally asks Walrus to pin the blob permanently.
- **Mint listings on Sui** – the `marketplace::create_listing` Move module stores the manifest, key package, price, and governance flags (`epochs`, `permanent`, `send_object_to`). Each listing emits events containing human + machine readable metadata.
- **Licence-based decryption** – on purchase the contract mints a Licence NFT that carries the encrypted key package and timestamp; the TypeScript SDK or CLI decrypts locally once both blob + licence are fetched.
- **Agent-first** – structured metadata, CLI commands, and the `BlobSeaAgent` class are designed so HTTP 402 billing hooks can expose pay‑per‑request APIs in the future.


---

## 2. Repository Layout

```
BlobSea/
├─ move/                # Sui Move package (marketplace module)
├─ frontend/            # Next.js app (Tailwind + pixel-inspired UI)
│  ├─ app/              # App Router pages (home, market, sell, inventory)
│  ├─ components/       # Hero, ListingGallery, ListingCreator, Inventory, UI kit
│  ├─ hooks/            # useMarketplaceListings, etc.
│  └─ public/           # Icons, architecture diagrams
├─ sdk/                 # @blobsea/cli TypeScript toolkit (Walrus + Sui automation)
├─ move/tests, scripts  # On-chain unit tests/helpers
└─ README.md
```

Key assets:
- `frontend/app/icon.svg` – pixel logo used in the browser tab favicon.
- `frontend/components/InventoryView.tsx` – standalone inventory route so `/inventory` matches the design system.
- `frontend/public/blobsea-architecture.mmd` – raw Mermaid file for the solution overview slide.
- `BLOBSEA_DECK_FLOWS.md` – deck-ready diagrams; `docs/` – GitBook source (Markdown) for hosted docs.

---

## 3. Setting up the Frontend

1. **Requirements**
   - Node.js ≥ 18, PNPM ≥ 8
   - Sui CLI (1.60+) configured for testnet with SUI tokens
   - Walrus publisher/aggregator (defaults to official testnet endpoints)

2. **Environment variables**
   - Copy `frontend/.env.example` to `frontend/.env` and fill:
     - `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID` – Move package id from publish step
     - `NEXT_PUBLIC_MARKETPLACE_ID` – Marketplace shared object id
     - `NEXT_PUBLIC_WALRUS_GATEWAY`, `NEXT_PUBLIC_WALRUS_BLOB_BASE` (override if self-hosting)

3. **Deploy Move package**
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
   Record the package id + created Marketplace object and place them in `.env`.

4. **Run the Next.js app**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
   The app runs on `http://localhost:3000`. Connect a Sui wallet (Sui Wallet, Ethos, etc.) to list or purchase.

### Pages
- `/` – Hero, feature grid, SDK card (1:1 with the blobsea Figma).
- `/market` – Live listings with ItemCard UI, filter pills, label icons.
- `/sell` – Creator workspace (drag/drop file, price, epochs).
- `/inventory` – Buyer licences page using the new pixel inventory cards.

---

## 4. CLI & SDK (`sdk/`)

`@blobsea/cli` gives you the exact same workflow as the web app but in a scriptable form.

1. **Install & build**
   ```bash
   cd sdk
   pnpm install
   pnpm build   # or pnpm dev -- --help
   ```

2. **Config** – create `blobsea.config.json` or `.env`:
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

3. **Commands**
   ```bash
   blobsea-cli --help
   blobsea-cli encrypt ./data.bin --terms ./terms.pdf --manifest ./out/manifest.json
   blobsea-cli upload ./data.bin --config ./blobsea.config.json
   blobsea-cli listing create ./out/manifest.json --price 1.5
   blobsea-cli listing list
   blobsea-cli license list
   blobsea-cli license download <LICENSE_ID> --out ./dataset.bin
   ```

4. **Workflow**
   - Encrypt → upload → `listing create` to sell
   - Buyers run `license download` to fetch + decrypt using their licence NFT

The CLI is pure TypeScript and ships as `@blobsea/cli` (v0.1.0-beta). It intentionally does not bundle React/Next, so you can use it in CI or external agents.

---

## 5. Security & Cryptography Notes

- **AES-GCM**: Browser/CLI wraps ciphertext + nonce + filename; key packages are stored in licence objects only.
- **Walrus integrity**: sha3_256 hash from Walrus is stored/verified before decrypting; alerts show when mismatched.
- **Sui provenance**: Listings and licences are Sui objects with event logs; `send_object_to`, `epochs`, `permanent` are already parameterized for compliance.
- **Inventory UI**: `LicenseInventory` card now truncates IDs and surfaces decrypt CTA, matching the blobsea design while keeping `downloadWithLicense` intact.

---

## 6. HTTP 402 / Agent Vision

Even though HTTP 402 billing isn’t implemented yet, the architecture reserves the hooks:
1. **Structured metadata** – listing/category/schema fields make catalogue pages machine-readable.
2. **Licence as capability** – licences gate downloads so agents can programmatically decide whether to pay/renew.
3. **SDK hooks** – `BlobSeaAgent` already sequences listing query → purchase → download; adding 402 responses is a matter of surfacing a “Payment Required” envelope.
4. **Roadmap** – see Slide 12 diagram in `BLOBSEA_DECK_FLOWS.md` for milestones (HTTP 402 API spec, billing registry, autonomous settlements on Sui mainnet).

---

## 7. Links

- Docs (GitBook): https://coooder.gitbook.io/blobsea/
- Repo: https://github.com/Coooder-Crypto/BlobSea
- CLI/SDK: `@blobsea/cli` (v0.1.0-beta)

## 8. Contributing / Next Steps

- Expand listing metadata (`category`, `data_format`, `schema`) so agents can reason about catalog entries.
- Add policy fields on licences (expiry, usage count) for future 402 enforcement.
- Publish official REST/webhook endpoints for Walrus download + licence verification so third-party agents don’t have to embed Next.js.
- Continue aligning CLI/SDK versions; document the `BlobSeaAgent` API in the deck/README.

Feel free to open issues or PRs if you ship new Move features, SDK commands, or HTTP 402 experiments.
