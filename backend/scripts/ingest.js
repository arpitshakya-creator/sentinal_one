import "../lib/env.js";
import { runIngest } from "../lib/ingest.js";

async function main() {
  console.log("Pulling live CVE intelligence from NVD + CISA KEV...");
  console.log(
    process.env.NVD_API_KEY
      ? "Using NVD API key (higher rate limit)."
      : "No NVD API key set — throttling requests (~6.5s each) to respect the public rate limit."
  );
  const t0 = Date.now();
  const result = await runIngest();
  console.log("\nIngestion complete in", ((Date.now() - t0) / 1000).toFixed(1), "s");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
