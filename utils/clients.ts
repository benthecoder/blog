import { VoyageAIClient } from "voyageai";
import { Anthropic } from "@anthropic-ai/sdk";

let voyageClientInstance: VoyageAIClient | null = null;

export function getVoyageClient(): VoyageAIClient {
  if (!voyageClientInstance) {
    if (!process.env.VOYAGE_AI_API_KEY) {
      throw new Error("VOYAGE_AI_API_KEY is not set");
    }
    voyageClientInstance = new VoyageAIClient({
      apiKey: process.env.VOYAGE_AI_API_KEY,
    });
  }
  return voyageClientInstance;
}

let anthropicClientInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClientInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    anthropicClientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClientInstance;
}
