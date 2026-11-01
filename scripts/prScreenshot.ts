/**
 * Screenshots pages for a pull request and prints markdown to paste into the
 * PR body. GitHub has no API for attaching images to a PR, so the files go to
 * R2 under `pr/<branch>/` and the PR links to their public URLs.
 *
 * Captures run in a headless Chromium (Helium, Chrome, or $CHROME_PATH), so no
 * Playwright download is needed.
 *
 *   pnpm pr:screenshot /posts/140826 /journal
 *   pnpm pr:screenshot --mobile /map
 *   pnpm pr:screenshot --base https://bneo.xyz /    # "before" from production
 *   pnpm pr:screenshot ./verify.html                # a local file, e.g. command output
 *
 * Paths resolve against --base (default http://localhost:3000). Arguments that
 * name an existing local file are captured from disk instead.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import { config } from "dotenv";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, r2Bucket } from "@/utils/r2";

config({ path: ".env" });
config({ path: ".env.local" });

const BROWSERS = [
  process.env.CHROME_PATH,
  "/Applications/Helium.app/Contents/MacOS/Helium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((p): p is string => Boolean(p));

const VIEWPORTS = { desktop: "1280,900", mobile: "390,844" } as const;

type Options = { base: string; mobile: boolean; paths: string[] };

function parseArgs(argv: string[]): Options {
  const options: Options = {
    base: "http://localhost:3000",
    mobile: false,
    paths: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mobile") options.mobile = true;
    else if (arg === "--base") options.base = argv[++i] ?? options.base;
    else options.paths.push(arg);
  }
  if (options.paths.length === 0) {
    throw new Error(
      "usage: pnpm pr:screenshot [--mobile] [--base URL] <path>..."
    );
  }
  return options;
}

function findBrowser(): string {
  const browser = BROWSERS.find((p) => fs.existsSync(p));
  if (!browser) {
    throw new Error("No Chromium browser found. Set CHROME_PATH.");
  }
  return browser;
}

function currentBranch(): string {
  return execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
}

function slugify(value: string): string {
  return value.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";
}

function capture(browser: string, url: string, size: string, out: string) {
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${size}`,
      "--virtual-time-budget=4000",
      `--screenshot=${out}`,
      url,
    ],
    { stdio: "ignore", timeout: 60_000 }
  );
  if (!fs.existsSync(out)) throw new Error(`Screenshot failed for ${url}`);
}

async function upload(file: string, key: string): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) throw new Error("R2_PUBLIC_URL must be set");
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: "image/png",
    })
  );
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const browser = findBrowser();
  const branch = slugify(currentBranch());
  const viewport = options.mobile ? "mobile" : "desktop";
  const remoteSource =
    new URL(options.base).hostname === "localhost" ? "after" : "before";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pr-shot-"));
  const stamp = Date.now().toString(36);

  for (const pagePath of options.paths) {
    const isFile = fs.existsSync(pagePath) && fs.statSync(pagePath).isFile();
    const url = isFile
      ? pathToFileURL(path.resolve(pagePath)).toString()
      : new URL(pagePath, options.base).toString();
    const source = isFile ? "output" : remoteSource;
    const label = isFile ? path.basename(pagePath, ".html") : pagePath;
    const name = `${slugify(label)}-${viewport}-${source}-${stamp}.png`;
    const file = path.join(dir, name);
    capture(browser, url, VIEWPORTS[viewport], file);
    const imageUrl = await upload(file, `pr/${branch}/${name}`);
    console.log(`![${label} (${viewport}, ${source})](${imageUrl})`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
