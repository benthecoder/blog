import "server-only";

type RedisCommand = (string | number)[];
type RedisResult = { result?: unknown; error?: string };
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function requestRedis(
  body: RedisCommand | RedisCommand[],
  endpoint = ""
) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Missing Upstash Redis credentials");
  }
  const response = await fetch(
    `${UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}${endpoint}`,
    {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw new Error("Upstash request failed");
  return response.json();
}

function resultOf(data: RedisResult): unknown {
  if (data.error) throw new Error(data.error);
  return data.result;
}

export async function upstashRequest(command: RedisCommand) {
  return resultOf(await requestRedis(command));
}

/** Batch independent commands in one HTTP request; this is not a transaction. */
export async function upstashPipeline(
  commands: RedisCommand[]
): Promise<unknown[]> {
  if (!commands.length) return [];
  const data: RedisResult[] = await requestRedis(commands, "/pipeline");
  if (!Array.isArray(data) || data.length !== commands.length) {
    throw new Error("Invalid Upstash pipeline response");
  }
  // Never return a partially successful leaderboard when any command fails.
  return data.map(resultOf);
}
