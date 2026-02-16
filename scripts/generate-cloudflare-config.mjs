import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = "_config.cloudflare.generated.yml";
const token = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim() ?? "";

const yaml = [
  "cloudflare:",
  "  analytics:",
  `    token: ${JSON.stringify(token)}`,
  ""
].join("\n");

const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
fs.writeFileSync(absoluteOutputPath, yaml, "utf8");

if (token) {
  console.log(`Generated ${OUTPUT_PATH} with analytics token.`);
} else {
  console.log(`Generated ${OUTPUT_PATH} without analytics token (tracking disabled).`);
}
