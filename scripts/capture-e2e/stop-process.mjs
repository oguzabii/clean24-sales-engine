/** @param {import("node:child_process").ChildProcess | undefined} child */
export async function stopCaptureProcess(child, graceful = false) {
  // Signal termination leaves exitCode null, but a second exit event will never arrive.
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const ended = new Promise((resolve) => child.once("exit", resolve));
  if (graceful && child.connected) child.send({ action: "stop" }); else child.kill();
  const timer = setTimeout(() => child.kill(), 15_000);
  try { await ended; } finally { clearTimeout(timer); }
}
