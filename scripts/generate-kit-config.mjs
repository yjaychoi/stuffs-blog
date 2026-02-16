import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = "_config.kit.generated.yml";
const formId = process.env.KIT_FORM_ID?.trim() ?? "";
const formUid = process.env.KIT_FORM_UID?.trim() ?? "";

const errors = [];

if (!/^[0-9]+$/.test(formId)) {
  errors.push("KIT_FORM_ID must be numeric (e.g. 9091622).");
}

if (!/^[a-z0-9]+$/.test(formUid)) {
  errors.push("KIT_FORM_UID must be lowercase alphanumeric (e.g. 7a2ec6f819).");
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

const yaml = [
  "kit:",
  "  form:",
  `    form_id: "${formId}"`,
  `    form_action: "https://app.kit.com/forms/${formId}/subscriptions"`,
  `    form_uid: "${formUid}"`,
  ""
].join("\n");

const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
fs.writeFileSync(absoluteOutputPath, yaml, "utf8");
console.log(`Generated ${OUTPUT_PATH}`);
