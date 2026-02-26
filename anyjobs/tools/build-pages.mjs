import { spawnSync } from 'node:child_process';

function normalizeBase(base) {
  if (!base) return './';
  if (base === './') return './';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

function computeBase() {
  if (process.env.BASE_URL) return process.env.BASE_URL;

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repo) return repo.endsWith('.github.io') ? '/' : `/${repo}/`;

  // Local/manual builds (path-agnostic for static hosting)
  return './';
}

const base = normalizeBase(computeBase());

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  'ng',
  'build',
  '--configuration',
  'production',
  '--base-href',
  base,
  '--deploy-url',
  base,
];

const res = spawnSync(cmd, args, { stdio: 'inherit' });
process.exit(res.status ?? 1);

