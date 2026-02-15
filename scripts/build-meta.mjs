import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function resolveEpoch() {
  if (process.env.SOURCE_DATE_EPOCH) {
    const parsed = Number.parseInt(process.env.SOURCE_DATE_EPOCH, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  try {
    const output = execSync("git log -1 --pretty=%ct", { encoding: "utf8" }).trim();
    const parsed = Number.parseInt(output, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    // Fall back to current time when git metadata is unavailable.
  }

  return Math.floor(Date.now() / 1000);
}

function resolveAssetVersion(epoch) {
  const sha = process.env.GITHUB_SHA || process.env.DEPLOY_SHA;
  if (sha && /^[a-f0-9]{7,40}$/i.test(sha)) {
    return sha.slice(0, 12).toLowerCase();
  }
  return `epoch-${epoch}`;
}

const epoch = resolveEpoch();
const iso = new Date(epoch * 1000).toISOString().replace(".000Z", "Z");

const payload = {
  SITE_BUILD_DATE_UTC: iso,
  asset_version: resolveAssetVersion(epoch)
};

const dataDir = path.join(process.cwd(), "_data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(path.join(dataDir, "build_meta.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
