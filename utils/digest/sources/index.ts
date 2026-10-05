import type { LinkSource } from "../types";
import { curius } from "./curius";
import { tweets } from "./tweets";

// Register new sources here.
export const SOURCES: Record<string, LinkSource> = {
  curius,
  tweets,
};
