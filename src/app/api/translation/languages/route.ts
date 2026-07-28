import "server-only";
import { NextResponse } from "next/server";
import * as deepl from "deepl-node";

const apiKey = process.env.DEEPL_API_KEY!;
const translator = new deepl.Translator(apiKey);

const TTL_MS = 6 * 60 * 60 * 1000;
let cache: { languages: { code: string; name: string }[]; fetchedAt: number } | null = null;

export async function GET() {
  const now = Date.now();

  if (!cache || now - cache.fetchedAt > TTL_MS) {
    const targetLanguages = await translator.getTargetLanguages();
    cache = {
      languages: targetLanguages.map((l) => ({ code: l.code, name: l.name })),
      fetchedAt: now,
    };
  }

  return NextResponse.json({ languages: cache.languages });
}
