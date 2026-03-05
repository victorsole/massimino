// Ensures .next/server/ directory and middleware-manifest.json exist before dev starts.
// This works around a Next.js 14 + Node 22 issue where the server directory
// isn't created during dev compilation, causing middleware-manifest.json 500 errors.
const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, '..', '.next', 'server');
const manifestPath = path.join(serverDir, 'middleware-manifest.json');

if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
  console.log('Created .next/server/ directory');
}

if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, JSON.stringify({
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    version: 2
  }));
  console.log('Created middleware-manifest.json');
}

// Also handle optional CLEAN_ON_DEV
if (process.env.CLEAN_ON_DEV === 'true') {
  require('child_process').execSync('npm run clean', { stdio: 'inherit' });
  // Re-create after clean
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  fs.writeFileSync(manifestPath, JSON.stringify({
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    version: 2
  }));
}
