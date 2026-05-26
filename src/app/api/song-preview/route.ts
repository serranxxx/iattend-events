import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get("track");
  const artist = req.nextUrl.searchParams.get("artist");

  if (!track || !artist) {
    return NextResponse.json({ previewUrl: null });
  }

  try {
    const query = encodeURIComponent(`${track} ${artist}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&limit=1`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const previewUrl = data.results?.[0]?.previewUrl ?? null;
    return NextResponse.json({ previewUrl });
  } catch {
    return NextResponse.json({ previewUrl: null });
  }
}
