# FAQ

**Q: How do I deploy the Move contracts?**  
A: `sui client publish .` in `move/`, then call `publish_marketplace` with treasury + fee args; copy package id + marketplace object into `.env` / config.

**Q: What if Walrus hash mismatches on download?**  
A: The UI/CLI warns but does not hard-stop; investigate your endpoint integrity. The hash comes from Walrus (sha3_256 over the payload). Consider re-uploading or switching to a trusted publisher.

**Q: Can I self-host Walrus endpoints?**  
A: Yes. Override `NEXT_PUBLIC_WALRUS_GATEWAY` / `NEXT_PUBLIC_WALRUS_BLOB_BASE` (frontend) and `walrusGateway` / `walrusBlobBase` (CLI config).

**Q: Are payments only in SUI?**  
A: Current payment method is direct SUI (`PAYMENT_METHOD_DIRECT_SUI`). The contract is structured to add more methods and HTTP 402 alignment later.

**Q: How are files encrypted?**  
A: Client-side AES-GCM; payload = nonce + auth tag + ciphertext. Key package (nonce, key, filename) is stored in the licence and only decrypted locally after purchase.

**Q: Where can I get diagrams?**  
A: `BLOBSEA_DECK_FLOWS.md` and `frontend/public/blobsea-architecture.mmd` hold Mermaid diagrams; GitBook renders them directly.

**Q: Is the SDK the same as the web flow?**  
A: Yes. `BlobSeaAgent` and `@blobsea/cli` replicate the Walrus upload + Sui listing/licence + decrypt flow without the UI.
