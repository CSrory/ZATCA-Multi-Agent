import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  getActiveProvider,
  getTextModel,
  getVisionModel
  GROQ_TEXT_MODEL,
  GROQ_VISION_MODEL,
} from "@/lib/agents/llm";

export const runtime = "nodejs";

export async function GET() {
  const provider = getActiveProvider();

  const base = {
    provider,
    groq: {
      textModel: GROQ_TEXT_MODEL,
      visionModel: GROQ_VISION_MODEL,
    },
  };

  if (provider === "none") {
    return NextResponse.json({
      ...base,
      ok: false,
      error: "No LLM configured (set GROQ_API_KEY or OPENAI_API_KEY).",
    });
  }

  try {
    const model = getTextModel();
    const r = await generateText({
      model,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      maxOutputTokens: 5,
      temperature: 0,
    });

    return NextResponse.json({
      ...base,
      ok: true,
      probe: r.text.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ...base,
      ok: false,
      error: message,
    });
  }
}

