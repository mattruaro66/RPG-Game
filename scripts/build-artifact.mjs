// Gera um único HTML autocontido (JS e CSS embutidos) para publicar como artefato.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const out = process.argv[2] ?? 'dist-artifact/nova-iorque-1992.html';
const assets = join('dist', 'assets');
const files = readdirSync(assets);
const js = readFileSync(join(assets, files.find((f) => f.endsWith('.js'))), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(assets, files.find((f) => f.endsWith('.css'))), 'utf8');

const html = `<title>Nova Iorque: 1992</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} — ${(html.length / 1024).toFixed(0)} KB`);
