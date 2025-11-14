const DEFAULT_BASE =
  process.env.WALRUS_BLOB_BASE ??
  "https://aggregator.walrus-testnet.walrus.space/v1/blobs";

type Params = {
  blobId: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Params },
): Promise<Response> {
  const target = `${DEFAULT_BASE}/${params.blobId}`;
  try {
    const upstream = await fetch(target);
    if (!upstream.ok) {
      const text = await upstream.text();
      return Response.json(
        { error: "Walrus fetch failed", upstream: text },
        { status: upstream.status },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "content-length": upstream.headers.get("content-length") ?? "",
      },
    });
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
