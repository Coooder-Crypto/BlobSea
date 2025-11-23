"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

import { Manifest, buildKeyPackage, encryptAndUpload } from "@/lib/walrus";
import { useNetworkVariable } from "@/lib/networkConfig";
import { hexToBytes } from "@/lib/bytes";
import { Button as PixelButton } from "@/components/UI/Button";

type Status =
  | { state: "idle" }
  | { state: "uploading" }
  | { state: "submitting" }
  | { state: "success"; digest: string }
  | { state: "error"; message: string };

type Props = {
  currentAddress?: string;
};

const SUI_TYPE = "0x2::sui::SUI";
const PAYMENT_METHOD_DIRECT_SUI = 0;

const labelClass = "font-mono text-[11px] uppercase tracking-[0.35em] text-white/60";
const inputClass =
  "w-full border-2 border-white/15 bg-[#070d1a] px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-walrus-cyan focus:outline-none";

export default function ListingCreator({ currentAddress }: Props) {
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const marketplaceId = useNetworkVariable("marketplaceId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [file, setFile] = useState<File | null>(null);
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [priceSui, setPriceSui] = useState("0.1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [epochs, setEpochs] = useState(1);
  const [permanent, setPermanent] = useState(false);
  const [sendObjectToSelf, setSendObjectToSelf] = useState(true);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const termsInputRef = useRef<HTMLInputElement | null>(null);

  const manifestJson = manifest ? JSON.stringify(manifest, null, 2) : "";

  const canSubmit =
    Boolean(currentAddress) &&
    Boolean(file) &&
    marketplacePackageId &&
    marketplaceId &&
    Number(priceSui) > 0 &&
    title.trim().length > 0 &&
    status.state !== "uploading" &&
    status.state !== "submitting";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setManifest(null);
  };

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setTermsFile(selected);
    setManifest(null);
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setManifest(null);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const openTermsPicker = () => termsInputRef.current?.click();

  const handleSubmit = async () => {
    if (!file || !canSubmit || !marketplacePackageId || !marketplaceId) return;
    const trimmedTitle = title.trim();
    const descriptionText = description.trim();
    const nameBytes = stringToBytes(trimmedTitle);
    const descriptionBytes = stringToBytes(descriptionText);
    if (nameBytes.length === 0) {
      setStatus({ state: "error", message: "Name must not be empty" });
      return;
    }
    if (nameBytes.length > 128) {
      setStatus({ state: "error", message: "Name must be 128 bytes or fewer" });
      return;
    }
    if (descriptionBytes.length > 2048) {
      setStatus({
        state: "error",
        message: "Description must be 2048 bytes or fewer",
      });
      return;
    }

    let activeManifest = manifest;
    if (!activeManifest) {
      setStatus({ state: "uploading" });
      try {
        const query: Record<string, string | number | boolean> = { epochs };
        if (permanent) {
          query.permanent = true;
        }
        if (sendObjectToSelf && currentAddress) {
          query.send_object_to = currentAddress;
        }
        const uploadResult = await encryptAndUpload(file, {
          termsFile,
          query,
        });
        activeManifest = uploadResult.manifest;
        setManifest(activeManifest);
      } catch (error) {
        setStatus({
          state: "error",
          message: error instanceof Error ? error.message : String(error),
        });
        return;
      }
    }

    submitListing({
      manifest: activeManifest,
      descriptionBytes,
      nameBytes,
      priceSui,
      marketplaceId,
      marketplacePackageId,
      signAndExecute,
      suiClient,
      setStatus,
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-8">
        <div
          className={`border-2 border-dashed p-8 text-center transition-colors duration-300 ${dragActive ? "border-walrus-cyan bg-walrus-cyan/5" : "border-white/20 bg-[#070d1a]"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="font-mono text-xs uppercase tracking-[0.35em] text-white/50">
            Dataset Upload
          </div>
          <h3 className="mt-3 font-mono text-2xl text-white">Drag & Drop File</h3>
          <p className="mt-2 font-mono text-xs text-white/60">
            Max file size: 1GB for demo. Files encrypt locally before leaving your browser.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <PixelButton variant="outline" size="md" type="button" onClick={openFilePicker}>
              Select File
            </PixelButton>
            <PixelButton variant="outline" size="sm" type="button" onClick={openTermsPicker}>
              Upload Terms
            </PixelButton>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <input ref={termsInputRef} type="file" className="hidden" onChange={handleTermsChange} />
          {file && (
            <p className="mt-3 font-mono text-xs text-white/70">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
          {termsFile && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
              Terms: {termsFile.name}
            </p>
          )}
        </div>

        <div className="border-2 border-white/15 bg-[#070d1a] p-6 shadow-[0_24px_60px_rgba(1,3,10,0.45)]">
          <div className="mb-6 space-y-4">
            <div>
              <label className={labelClass}>Listing Name</label>
              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="Fine-tuned Llama 3 Weights"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={4}
                className={`${inputClass} mt-2 resize-none`}
                placeholder="Describe the dataset, schema, or model usage..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Price (SUI)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputClass} mt-2`}
                  value={priceSui}
                  onChange={(event) => setPriceSui(event.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Epochs</label>
                <input
                  type="number"
                  min="1"
                  className={`${inputClass} mt-2`}
                  value={epochs}
                  onChange={(event) => {
                    const next = Math.max(1, Number(event.target.value) || 1);
                    setEpochs(next);
                    setManifest(null);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-2 border-white/15 bg-black/30 p-5 md:grid-cols-2">
            <label className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-white/70">
              <input
                type="checkbox"
                className="h-4 w-4 border-2 border-white/40 bg-transparent"
                checked={permanent}
                onChange={(event) => {
                  setPermanent(event.target.checked);
                  setManifest(null);
                }}
              />
              Permanent Walrus storage
            </label>
            <label className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-white/70">
              <input
                type="checkbox"
                className="h-4 w-4 border-2 border-white/40 bg-transparent"
                checked={sendObjectToSelf}
                onChange={(event) => {
                  setSendObjectToSelf(event.target.checked);
                  setManifest(null);
                }}
                disabled={!currentAddress}
              />
              Send object to {currentAddress ? shorten(currentAddress) : "— connect wallet"}
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <PixelButton
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full disabled:border-white/20 disabled:bg-transparent disabled:text-white/40"
            >
              {status.state === "uploading"
                ? "Encrypting & uploading"
                : status.state === "submitting"
                  ? "Committing on chain"
                  : "Encrypt & publish"}
            </PixelButton>

            <div className="border-2 border-white/15 bg-white/5 p-4 font-mono text-xs text-white/70">
              {status.state === "idle" && (
                <p>Walrus uploads cache the manifest. If an on-chain transaction fails you can retry without uploading again.</p>
              )}
              {status.state === "uploading" && <p>Encrypting locally and pushing blobs to Walrus...</p>}
              {status.state === "submitting" && <p>Walrus upload done. Writing your listing on-chain...</p>}
              {status.state === "success" && status.digest && (
                <a
                  href={getExplorerTxUrl(status.digest)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-walrus-green hover:text-walrus-cyan"
                >
                  Transaction succeeded — view on chain
                </a>
              )}
              {status.state === "error" && <p className="text-red-400">{status.message}</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="border-2 border-white/15 bg-black/30 p-4">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">Marketplace ID</div>
              <div className="mt-2 font-mono text-sm text-white/80">
                {marketplaceId || "Set NEXT_PUBLIC_MARKETPLACE_ID"}
              </div>
            </div>
            <div className="border-2 border-white/15 bg-black/30 p-4">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">Package</div>
              <div className="mt-2 font-mono text-sm text-white/80">
                {marketplacePackageId || "Set NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID"}
              </div>
            </div>
          </div>

          {manifest && (
            <div className="mt-8 space-y-3">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">Latest Manifest</div>
              <textarea
                readOnly
                value={manifestJson}
                className="h-48 w-full border-2 border-white/15 bg-black/60 p-4 font-mono text-xs text-white"
              />
              <div className="grid gap-3 text-xs font-mono text-white/70 md:grid-cols-3">
                <div>
                  <div className="text-white/40">BlobId</div>
                  <div>{manifest.blobId || "(not returned)"}</div>
                </div>
                <div>
                  <div className="text-white/40">Terms Hash</div>
                  <div>{manifest.termsHash}</div>
                </div>
                {manifest.suiBlobObjectId && (
                  <div>
                    <div className="text-white/40">Blob Object</div>
                    <div>{manifest.suiBlobObjectId}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="border-2 border-walrus-cyan/40 bg-[#070d1a] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-walrus-cyan">Encryption</div>
          <p className="mt-3 text-sm text-white/70">
            Files are encrypted client-side with AES-GCM. Keys only unlock for verified buyers after on-chain purchase.
          </p>
          <div className="mt-4 flex items-center gap-2 font-mono text-xs text-walrus-green">
            <span className="h-3 w-3 rounded-full bg-walrus-green" /> Enabled
          </div>
        </div>
        <div className="border-2 border-walrus-purple/40 bg-[#070d1a] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-walrus-purple">Metadata</div>
          <div className="mt-4 space-y-2 text-xs font-mono text-white/70">
            <div className="flex justify-between">
              <span>Format</span>
              <span className="text-white">BlobSea Listing v1</span>
            </div>
            <div className="flex justify-between">
              <span>Chain</span>
              <span className="text-white">Sui Testnet</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="text-white">Walrus</span>
            </div>
          </div>
        </div>
        <div className="border-2 border-white/10 bg-[#070d1a] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Tips</div>
          <ul className="mt-3 space-y-2 text-xs text-white/60">
            <li>• Keep descriptions under 2 KB for on-chain storage.</li>
            <li>• Enable permanent storage for archival-grade datasets.</li>
            <li>• Terms files help automate license distribution.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

type SubmitArgs = {
  manifest: Manifest;
  descriptionBytes: Uint8Array;
  nameBytes: Uint8Array;
  priceSui: string;
  marketplaceId: string;
  marketplacePackageId: string;
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>["mutate"];
  suiClient: ReturnType<typeof useSuiClient>;
  setStatus: (status: Status) => void;
};

function submitListing({
  manifest,
  descriptionBytes,
  nameBytes,
  priceSui,
  marketplaceId,
  marketplacePackageId,
  signAndExecute,
  suiClient,
  setStatus,
}: SubmitArgs) {
  const tx = new Transaction();
  const manifestBytes = bcs.ser(Manifest, manifest).toBytes();
  const keyPackage = buildKeyPackage(manifest);

  const price = BigInt(Math.round(Number(priceSui) * 1_000_000_000));
  const payment = tx.splitCoins(tx.gas, [tx.pure.u64(price)]);

  const manifestVector = tx.pure.vector(manifestBytes);
  const keyPackageVector = tx.pure.vector(keyPackage);
  const nameVector = tx.pure.vector(nameBytes);
  const descriptionVector = tx.pure.vector(descriptionBytes);

  tx.moveCall({
    target: `${marketplacePackageId}::marketplace::create_listing`,
    typeArguments: [SUI_TYPE],
    arguments: [
      tx.object(marketplaceId),
      manifestVector,
      keyPackageVector,
      nameVector,
      descriptionVector,
      payment,
      tx.pure.u64(price),
      tx.pure.u8(PAYMENT_METHOD_DIRECT_SUI),
    ],
  });

  setStatus({ state: "submitting" });
  signAndExecute(
    { transaction: tx },
    {
      onSuccess: (result) => {
        suiClient
          .waitForTransaction({ digest: result.digest })
          .then(() => setStatus({ state: "success", digest: result.digest }))
          .catch((error) =>
            setStatus({
              state: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed while waiting for on-chain confirmation",
            }),
          );
      },
      onError: (error) =>
        setStatus({
          state: "error",
          message: error instanceof Error ? error.message : String(error),
        }),
    },
  );
}

function shorten(value?: string, length = 4) {
  if (!value) return "";
  return `${value.slice(0, length)}...${value.slice(-length)}`;
}

function stringToBytes(value: string) {
  return new TextEncoder().encode(value);
}

function getExplorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}

export function decodeHexManifest(hex: string) {
  const bytes = hexToBytes(hex);
  return bcs.de(Manifest, bytes);
}
