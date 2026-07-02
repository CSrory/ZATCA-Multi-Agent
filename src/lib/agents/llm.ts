/**
 * LLM provider — Groq (primary) with optional OpenAI fallback.
 * Set GROQ_API_KEY in .env — one server key serves all users.
 */

import { groq }  from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

export const GROQ_TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile";

function hasKey(name: string): boolean {
  const k = process.env[name] ?? "";
  return k.length > 10 && !k.startsWith("REPLACE") && k !== "";
}

export type LlmProvider = "groq" | "openai" | "none";

export function getActiveProvider(): LlmProvider {
  if (hasKey("GROQ_API_KEY")) return "groq";
  if (hasKey("OPENAI_API_KEY")) return "openai";
  return "none";
}

/** True when Groq or OpenAI is configured on the server */
export function isLlmConfigured(): boolean {
  return getActiveProvider() !== "none";
}

/** Vision + multimodal (invoice images) */
export function getVisionModel(): LanguageModel {
  const provider = getActiveProvider();
  if (provider === "groq") return groq(GROQ_VISION_MODEL);
  if (provider === "openai") return openai("gpt-4o");
  throw new Error("No LLM provider configured");
}

/** Text-only agents (forensics, market) */
export function getTextModel(): LanguageModel {
  const provider = getActiveProvider();
  if (provider === "groq") return groq(GROQ_TEXT_MODEL);
  if (provider === "openai") return openai("gpt-4o-mini");
  throw new Error("No LLM provider configured");
}

/** Label shown in API response */
export function getModelLabel(kind: "vision" | "text"): string {
  const provider = getActiveProvider();
  if (provider === "groq") {
    return kind === "vision" ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;
  }
  if (provider === "openai") {
    return kind === "vision" ? "gpt-4o" : "gpt-4o-mini";
  }
  return "deterministic";
}
