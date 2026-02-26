import fs from 'node:fs';
import path from 'node:path';

function findIndexHtmlDir(distDir) {
  const queue = [distDir];
  const visited = new Set();

  while (queue.length) {
    const dir = queue.shift();
    if (!dir || visited.has(dir)) continue;
    visited.add(dir);

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name === 'index.html') return dir;
      if (e.isDirectory()) queue.push(full);
    }
  }

  return null;
}

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const defaultBrowserDir = path.join(distDir, 'anyjobs', 'browser');

const outDir =
  (fs.existsSync(path.join(defaultBrowserDir, 'index.html')) && defaultBrowserDir) ||
  findIndexHtmlDir(distDir);

if (!outDir) {
  console.error(`No se encontró index.html dentro de ${distDir}`);
  process.exit(1);
}

const indexPath = path.join(outDir, 'index.html');
const notFoundPath = path.join(outDir, '404.html');
const noJekyllPath = path.join(outDir, '.nojekyll');

fs.copyFileSync(indexPath, notFoundPath);
fs.writeFileSync(noJekyllPath, '', { encoding: 'utf8' });

console.log(`GitHub Pages listo: ${path.relative(projectRoot, outDir)}`);

