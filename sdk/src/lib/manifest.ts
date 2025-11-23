export type Manifest = {
  blobId: string | null;
  walrusHash: string | null;
  contentHash: string;
  keyHex: string;
  nonceHex: string;
  termsHash: string;
  payloadBytes: number;
  sourceFileName: string;
  sourceFileSize: number;
  uploadedAt: string;
  suiBlobObjectId?: string | null;
};
