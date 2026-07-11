import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// Published images live in R2 under `images/<filename>`; drafts stay on the
// local filesystem. The site serves /images/* via a rewrite to R2_PUBLIC_URL.

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error(
        "R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY must be set"
      );
    }
    client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export function r2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET must be set");
  return bucket;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function imageContentType(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export function imageKey(fileName: string): string {
  return `images/${fileName}`;
}

export async function r2PutImage(
  fileName: string,
  body: Buffer
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: imageKey(fileName),
      Body: body,
      ContentType: imageContentType(fileName),
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function r2GetImage(fileName: string): Promise<Buffer> {
  const res = await getR2Client().send(
    new GetObjectCommand({ Bucket: r2Bucket(), Key: imageKey(fileName) })
  );
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function r2DeleteImage(fileName: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: r2Bucket(), Key: imageKey(fileName) })
  );
}

/** List image file names (without the images/ prefix) matching a name prefix. */
export async function r2ListImages(namePrefix = ""): Promise<string[]> {
  const names: string[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: r2Bucket(),
        Prefix: imageKey(namePrefix),
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) names.push(obj.Key.replace(/^images\//, ""));
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return names;
}
