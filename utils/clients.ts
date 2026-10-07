import { VoyageAIClient } from "voyageai";

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
