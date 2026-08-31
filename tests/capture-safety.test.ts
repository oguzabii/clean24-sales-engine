import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const guard = resolve("scripts/capture-e2e/network-guard.cjs");
const stopModule = pathToFileURL(resolve("scripts/capture-e2e/stop-process.mjs")).href;
const system = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp)$/i.test(key))), NODE_ENV: "test" as const };

test("capture network guard refuses a process without explicit test opt-in", () => {
  const result = spawnSync(process.execPath, ["--require", guard, "-e", "throw new Error('must not reach script')"], {
    env: system, encoding: "utf8", windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires an explicit isolated test process/);
});

test("capture guard blocks non-local destinations, legacy ports and unapproved SMTP ports before connection", () => {
  const result = spawnSync(process.execPath, ["--require", guard, "-e", `
    const assert = require('node:assert/strict');
    const net = require('node:net');
    const tls = require('node:tls');
    for (const options of [{host:'os.clean-24.ch',port:443}, {host:'127.0.0.1',port:54322}, {host:'localhost',port:587}]) {
      assert.throws(() => net.connect(options), /blocked outbound connection/);
    }
    assert.throws(() => tls.connect({host:'smtp.example.invalid',port:465}), /blocked outbound connection/);
    const { blockedDestinations, ...counts } = globalThis.__clean24CaptureEvidence;
    assert.deepEqual(counts, { socketConnections:0, deniedConnections:4, providerCalls:0, disabledTsxIpcProbes:0 });
    assert.equal(blockedDestinations.length, 4);
    assert.equal(blockedDestinations[0].host, 'os.clean-24.ch');
    assert.equal(blockedDestinations[0].port, 443);
  `], { env: { ...system, CLEAN24_CAPTURE_TEST: "1", CLEAN24_CAPTURE_PORTS: "55432" }, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});

test("capture guard rejects the mail provider even if SMTP is accidentally selected", () => {
  const result = spawnSync(process.execPath, ["--require", guard, "-e", `
    const assert = require('node:assert/strict');
    assert.throws(() => require('nodemailer').createTransport({}), /provider delivery is forbidden/);
    assert.deepEqual(globalThis.__clean24CaptureEvidence, { socketConnections:0, deniedConnections:0, providerCalls:1, disabledTsxIpcProbes:0, blockedDestinations:[] });
  `], { env: { ...system, CLEAN24_CAPTURE_TEST: "1", CLEAN24_CAPTURE_PORTS: "55432" }, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});

test("capture guard disables only the exact tsx parent pipe and blocks all other IPC destinations", () => {
  const result = spawnSync(process.execPath, ["--require", guard, "-e", String.raw`
    const assert = require('node:assert/strict');
    const net = require('node:net');
    const os = require('node:os');
    const path = require('node:path');
    const ownPath = path.join(os.tmpdir(), 'tsx-' + (process.geteuid ? process.geteuid() : os.userInfo().username), process.ppid + '.pipe');
    const ownPipe = process.platform === 'win32' ? '\\\\?\\pipe\\' + ownPath : ownPath;
    assert.throws(() => net.connect({path: ownPipe}), /tsx parent IPC disabled/);
    assert.throws(() => net.connect({path: ownPipe + '-unapproved'}), /blocked outbound connection/);
    assert.equal(globalThis.__clean24CaptureEvidence.disabledTsxIpcProbes, 1);
    assert.equal(globalThis.__clean24CaptureEvidence.deniedConnections, 1);
    assert.equal(globalThis.__clean24CaptureEvidence.socketConnections, 0);
  `], { env: { ...system, CLEAN24_CAPTURE_TEST: "1", CLEAN24_CAPTURE_PORTS: "55432" }, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});

test("capture cleanup returns for missing, normally exited and signal-terminated processes", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import { stopCaptureProcess } from ${JSON.stringify(stopModule)};
    await stopCaptureProcess(undefined);
    await stopCaptureProcess({exitCode:0,signalCode:null});
    await stopCaptureProcess({exitCode:null,signalCode:'SIGTERM'});
  `], { env: system, encoding: "utf8", timeout: 5_000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});

test("capture cleanup can stop the same real local process twice without hanging", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from 'node:assert/strict';
    import { spawn } from 'node:child_process';
    import { stopCaptureProcess } from ${JSON.stringify(stopModule)};
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'ignore',windowsHide:true});
    await stopCaptureProcess(child);
    assert.ok(child.exitCode !== null || child.signalCode !== null);
    await stopCaptureProcess(child);
    assert.equal(child.listenerCount('exit'), 0);
  `], { env: system, encoding: "utf8", timeout: 5_000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});

test("capture cleanup preserves graceful IPC shutdown before forced termination", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from 'node:assert/strict';
    import { spawn } from 'node:child_process';
    import { stopCaptureProcess } from ${JSON.stringify(stopModule)};
    const child = spawn(process.execPath, ['-e', "process.on('message', message => { if (message.action === 'stop') { process.disconnect(); process.exit(0); } });"],
      {stdio:['ignore','ignore','ignore','ipc'],windowsHide:true});
    await stopCaptureProcess(child, true);
    assert.equal(child.exitCode, 0);
    await stopCaptureProcess(child, true);
  `], { env: system, encoding: "utf8", timeout: 5_000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});
