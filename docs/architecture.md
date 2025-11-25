# Architecture

## Components
- **Frontend (Next.js)** – hero/market/sell/inventory pages; Walrus upload proxy under `/api/walrus/*`.
- **Move contracts** – `marketplace::create_listing / purchase_listing`; listings store Walrus IDs/hashes; licenses carry encrypted keys.
- **Walrus** – encrypted blobs + manifest; optional permanence; content hash (sha3_256) for integrity.
- **SDK/CLI** – `BlobSeaAgent` (TS) and `@blobsea/cli` mirror the web flow for agents/CI.

## Data Flow (global)
- Encrypt locally (AES-GCM) → upload to Walrus → manifest + hash → create listing on Sui → buyer purchases → license NFT → SDK/CLI downloads + decrypts.

## Cryptography
- AES-GCM client-side; payload = nonce + auth tag + ciphertext.
- Key package includes nonce, AES key, filename; stored in license.
- Walrus hash (sha3_256) checked before decrypt; mismatch surfaces warnings.

## Move Contract Notes
- Events include `name`, `description`, `walrus_hash`, `terms_hash` for UI/agents.
- Governance flags: `payment_method` (SUI), future hooks for expiry/usage limits.
- Helper params: `send_object_to`, `epochs`, `permanent` (Walrus side) surfaced in ListingCreator.

## Pages & UI
- `/market` – ItemCard UI over live listings with purchase CTA.
- `/sell` – drag/drop, price, epochs; combines Walrus upload + `create_listing` TX.
- `/inventory` – licenses with decrypt CTA; shows listing name/description and truncated IDs.

## Diagrams
See `../BLOBSEA_DECK_FLOWS.md` for Mermaid blocks:
- Global flow, crypto, key management, contract class diagram, agent state, HTTP 402 timeline.
