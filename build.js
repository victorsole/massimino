#!/usr/bin/env node

const { spawn } = require('child_process');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

// Create pages-manifest.json workaround for Next.js 15.5.6 bug
function createManifest() {
  try {
    const manifestPath = join(process.cwd(), '.next/server/pages-manifest.json');
    mkdirSync(join(process.cwd(), '.next/server'), { recursive: true });
    writeFileSync(manifestPath, '{}');
    console.log('✓ Created pages-manifest.json workaround');
  } catch (e) {
    // Ignore if already exists
  }
}

// Run Next.js build
const build = spawn('npx', ['next', 'build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let buildOutput = '';

build.stdout.on('data', (data) => {
  const text = data.toString();
  buildOutput += text;
  process.stdout.write(text);

  // When compilation is done, create the manifest before page collection
  if (text.includes('Compiled successfully')) {
    createManifest();
  }
});

build.stderr.on('data', (data) => {
  const text = data.toString();
  buildOutput += text;
  process.stderr.write(text);

  // If we hit the pages-manifest error, create it and retry
  if (text.includes('pages-manifest.json')) {
    createManifest();
  }
});

build.on('close', (code) => {
  if (code !== 0 && buildOutput.includes('pages-manifest.json')) {
    console.log('\n🔄 Retrying build with manifest workaround...\n');
    createManifest();

    // Retry build
    const retry = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      shell: true,
    });

    retry.on('close', (retryCode) => {
      process.exit(retryCode);
    });
  } else {
    process.exit(code);
  }
});
