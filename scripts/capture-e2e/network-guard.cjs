// Test-process preload only. Never imported by the application or deployed routes.
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preloads run before application imports. */
const net = require("node:net");
const tls = require("node:tls");
const Module = require("node:module");
const { syncBuiltinESMExports } = require("node:module");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir, userInfo } = require("node:os");

if (process.env.CLEAN24_CAPTURE_TEST !== "1") throw new Error("Capture guard requires an explicit isolated test process");
const evidence = { socketConnections: 0, deniedConnections: 0, providerCalls: 0, disabledTsxIpcProbes: 0, blockedDestinations: [] };
globalThis.__clean24CaptureEvidence = evidence;
function persistEvidence() {
  if (process.env.CLEAN24_CAPTURE_EVIDENCE) writeFileSync(process.env.CLEAN24_CAPTURE_EVIDENCE, JSON.stringify(evidence, null, 2));
}
persistEvidence();
const allowedPorts = new Set((process.env.CLEAN24_CAPTURE_PORTS || "").split(",").map(Number)
  .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535));
const tsxParentPath = join(tmpdir(), `tsx-${process.geteuid ? process.geteuid() : userInfo().username}`, `${process.ppid}.pipe`);
const tsxParentPipe = process.platform === "win32" ? `\\\\?\\pipe\\${tsxParentPath}` : tsxParentPath;

// Like the OS Vitest alias, resolve only the server-only marker. A global
// react-server condition changes React itself and breaks its PDF reconciler.
if (process.env.CLEAN24_CAPTURE_OS_SERVER === "1") {
  Module.registerHooks({ resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, specifier === "server-only"
      ? { ...context, conditions: [...context.conditions, "react-server"] }
      : context);
  } });
}

function destination(args) {
  if (Array.isArray(args[0])) return destination(args[0]);
  if (args[0] && typeof args[0] === "object") return { host: args[0].host || "localhost", port: Number(args[0].port), path: args[0].path };
  return { host: typeof args[1] === "string" ? args[1] : "localhost", port: Number(args[0]) };
}
function check(args) {
  const { host, port, path } = destination(args);
  if (path === tsxParentPipe) {
    // No tsx CLI parent is running; do not open even this optional local pipe.
    evidence.disabledTsxIpcProbes++;
    persistEvidence();
    throw Object.assign(new Error("tsx parent IPC disabled in the capture test"), { code: "ECONNREFUSED" });
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(host) || !allowedPorts.has(port)) {
    evidence.deniedConnections++;
    evidence.blockedDestinations.push({ host, port, ...(path ? { path } : {}), stack: new Error().stack });
    persistEvidence();
    throw new Error(`Capture test blocked outbound connection to ${host}:${port}`);
  }
  evidence.socketConnections++;
  persistEvidence();
}
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) { check(args); return connect.apply(this, args); };
const secureConnect = tls.connect;
tls.connect = function (...args) { check(args); return secureConnect.apply(this, args); };
syncBuiltinESMExports();

// Even a mistakenly selected SMTP adapter cannot reach its provider.
const load = Module._load;
Module._load = function (id, ...args) {
  if (id === "nodemailer" || /[\\/]nodemailer[\\/]/.test(id)) {
    return { createTransport() {
      evidence.providerCalls++;
      persistEvidence();
      throw new Error("SMTP/provider delivery is forbidden in the capture test");
    } };
  }
  return load.call(this, id, ...args);
};
process.on("exit", persistEvidence);
process.on("SIGTERM", () => process.exit(0));
