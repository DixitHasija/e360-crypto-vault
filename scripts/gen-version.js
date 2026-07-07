/* Generates src/version.json on every build/start.
   Runs locally (git) and on Vercel (VERCEL_GIT_COMMIT_SHA).
   The commit + buildTime change on every deployment, so the
   UI version tag updates automatically without manual bumps. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = require('../package.json');

function shortSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

const info = {
  version: pkg.version,
  commit: shortSha(),
  buildTime: new Date().toISOString(),
};

const outPath = path.join(__dirname, '..', 'src', 'version.json');
fs.writeFileSync(outPath, JSON.stringify(info, null, 2) + '\n');
console.log('[gen-version] src/version.json ->', info);
