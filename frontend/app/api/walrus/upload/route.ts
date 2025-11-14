import { NextRequest } from "next/server";

const DEFAULT_GATEWAY =
  process.env.WALRUS_GATEWAY ??
  "https://publisher.walrus-testnet.walrus.space/v1/blobs";

export async function POST(request: NextRequest) {
  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";
  const payload = await request.arrayBuffer();
  const url = new URL(request.url);
  const target = `${DEFAULT_GATEWAY}${url.search}`;

  try {
    const upstream = await fetch(target, {
      method: "PUT",
      headers: {
        "content-type": contentType,
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: payload,
    });

    const text = await upstream.text();
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // Upstream did not return JSON, surface raw response.
    }

    if (!upstream.ok) {
      return Response.json(
        { error: "Walrus upload failed", upstream: parsed || text },
        { status: upstream.status },
      );
    }

    const blobId =
      parsed.blobId ??
      parsed.id ??
      parsed?.newlyCreated?.blobObject?.blobId ??
      null;
    const hash =
      parsed.hash ??
      parsed.contentHash ??
      parsed?.newlyCreated?.blobObject?.storage?.id ??
      null;

    return Response.json(
      {
        blobId,
        hash,
        proof: parsed.proof ?? null,
        raw: parsed,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach Walrus gateway",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
