import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = "_config.naver.generated.yml";
const token = process.env.NAVER_SITE_VERIFICATION?.trim() ?? "";
const serializedToken = token ? JSON.stringify(token) : "null";

const yaml = [
  `naver_site_verification: ${serializedToken}`,
  ""
].join("\n");

const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
fs.writeFileSync(absoluteOutputPath, yaml, "utf8");

if (token) {
  console.log(`Generated ${OUTPUT_PATH} with naver verification token.`);
} else {
  console.log(`Generated ${OUTPUT_PATH} without naver verification token.`);
}
