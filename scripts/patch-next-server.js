// Patches Next.js 14 getMiddlewareManifest to gracefully handle missing manifest file.
// Without this, `next dev` crashes with "Cannot find module middleware-manifest.json"
// because the .next/server/ directory is never written to disk during dev compilation.
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server', 'next-server.js');

if (!fs.existsSync(filePath)) {
  console.log('next-server.js not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const original = `getMiddlewareManifest() {
        if (this.minimalMode) return null;
        const manifest = require(this.middlewareManifestPath);
        return manifest;
    }`;

const patched = `getMiddlewareManifest() {
        if (this.minimalMode) return null;
        try {
            const manifest = require(this.middlewareManifestPath);
            return manifest;
        } catch (e) {
            return { sortedMiddleware: [], middleware: {}, functions: {}, version: 2 };
        }
    }`;

if (content.includes('catch (e) {')) {
  console.log('next-server.js already patched');
  process.exit(0);
}

if (!content.includes(original)) {
  console.log('next-server.js format changed, patch may not be needed');
  process.exit(0);
}

content = content.replace(original, patched);
fs.writeFileSync(filePath, content);
console.log('Patched next-server.js: getMiddlewareManifest now handles missing manifest gracefully');
