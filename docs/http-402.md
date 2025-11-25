# HTTP 402 / Agent Vision

## Current State
- Architecture reserves 402 hooks; not implemented yet.
- Listings already carry structured metadata (name, description, walrus_hash, terms_hash).
- Licenses gate decryption and can be extended with expiry/usage limits.

## Roadmap (see diagram in BLOBSEA_DECK_FLOWS.md)
- 2024 Q4: SDK exposes automation hooks; reserve 402 handlers.
- 2025 Q1: Draft HTTP 402 API spec; launch agent billing registry.
- 2025 Q2: Enable autonomous settlements on Sui mainnet.

## Intended 402 Flow
1) Agent requests data → API responds 402 with required listing id/terms.
2) Agent buys via Sui (or already holds a valid licence).
3) Licence proves entitlement; Walrus blob downloads; hashes verified.
4) Pipeline consumes decrypted payload; audit trails remain on-chain.

## What’s Needed Next
- Policy fields on licence (expiry, usage count).
- REST/webhooks to surface 402 responses and payment prompts.
- Catalogue metadata (`category`, `schema`) for machine-readable discovery.
- Monitoring hooks so agents can auto-renew and keep receipts.
