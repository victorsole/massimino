// Wrapper for `next dev` that ensures .next/server/middleware-manifest.json exists.
// Next.js 14 + Node 22 has a bug where the server directory never gets created
// during dev compilation, causing every page to 500 after the first request.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const serverDir = path.join(nextDir, 'server');
const manifestPath = path.join(serverDir, 'middleware-manifest.json');
const manifestContent = JSON.stringify({
  sortedMiddleware: [],
  middleware: {},
  functions: {},
  version: 2,
});

function ensureManifest() {
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, manifestContent);
  }
}

// Watch for .next directory changes — re-create manifest whenever it's wiped
const interval = setInterval(() => {
  try {
    // Only create if .next exists (meaning next dev has started) but server/ is missing
    if (fs.existsSync(nextDir) && !fs.existsSync(manifestPath)) {
      ensureManifest();
    }
  } catch {
    // Ignore transient filesystem errors during compilation
  }
}, 500);

// Spawn next dev
const child = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
});

child.on('exit', (code) => {
  clearInterval(interval);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  clearInterval(interval);
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  child.kill('SIGTERM');
});
