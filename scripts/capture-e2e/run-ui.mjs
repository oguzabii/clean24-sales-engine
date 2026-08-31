// Browser-only matrix with intercepted APIs. No OS server or database is started.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [osRepoArg, playwrightModule] = process.argv.slice(2);
if (!osRepoArg || !playwrightModule) throw new Error("Usage: node run-ui.mjs READ_ONLY_OS_REPO PLAYWRIGHT_MODULE");
const osRepo = resolve(osRepoArg), here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../..");
const output = join(repo, ".git", "richtpreis-qa");
mkdirSync(output, { recursive: true });
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  /^(path|pathext|systemroot|windir|comspec|temp|tmp|userprofile|homedrive|homepath|appdata|localappdata)$/i.test(key)));
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const url = `http://127.0.0.1:${port}`;
const networkPath = join(output, "ui-server-network.json");
const log = createWriteStream(join(output, "ui-server.log"));
const server = spawn(process.execPath, [join(repo, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: repo, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...env, NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1", CLEAN24_CAPTURE_TEST: "1", CLEAN24_CAPTURE_PORTS: String(port),
    CLEAN24_CAPTURE_EVIDENCE: networkPath, NODE_OPTIONS: `--require "${join(here, "network-guard.cjs").replaceAll("\\", "/")}"`,
    CLEAN24_OS_BASE_URL: "", SALES_ENGINE_INTEGRATION_SECRET: "", SALES_ENGINE_QUOTE_TOKEN_SECRET: "",
    CLEAN24_LEAD_WEBHOOK_URL: "", SMTP_HOST: "", SMTP_USER: "", SMTP_PASSWORD: "" },
});
server.stdout.pipe(log, { end: false });
server.stderr.pipe(log, { end: false });
let matrix;
try {
  const until = Date.now() + 60_000;
  while (true) {
    if (server.exitCode !== null) throw new Error(`Formular stopped with ${server.exitCode}`);
    try { if ((await fetch(url)).ok) break; } catch { /* Wait for local startup. */ }
    if (Date.now() > until) throw new Error("Local UI server startup timed out");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log(`LOCAL_UI=${url}; all browser API responses intercepted; no database`);
  matrix = spawn(process.execPath, ["--import", "tsx", join(repo, "scripts/verify-richtpreis.mjs"), url, playwrightModule, osRepo], {
    cwd: osRepo, env: { ...env, NODE_ENV: "test", NEXT_TELEMETRY_DISABLED: "1" }, windowsHide: true, stdio: "inherit",
  });
  const code = await new Promise((resolve, reject) => { matrix.once("exit", resolve); matrix.once("error", reject); });
  assert.equal(code, 0, "The complete desktop/mobile matrix must pass");
  const network = JSON.parse(readFileSync(networkPath, "utf8"));
  assert.equal(network.deniedConnections, 0);
  assert.equal(network.providerCalls, 0);
  console.log(`UI_SERVER_NETWORK=${JSON.stringify(network)}`);
} finally {
  if (matrix && matrix.exitCode === null) {
    const stopped = new Promise((resolve) => matrix.once("exit", resolve));
    matrix.kill();
    await stopped;
  }
  if (server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await stopped;
  }
  log.end();
}
