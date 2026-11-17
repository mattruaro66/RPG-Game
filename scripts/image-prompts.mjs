// Gera IMAGE_PROMPTS.md a partir de src/data/images.ts (fonte única).
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

const out = await build({ entryPoints: ['src/data/images.ts'], bundle: true, format: 'esm', write: false, platform: 'node' });
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const { IMAGE_SLOTS, KIND_LABELS, NOIR_STYLE } = mod;

const lines = [
  '# Prompts de imagem',
  '',
  'Gerado automaticamente a partir de `src/data/images.ts` (`npm run image-prompts`). Não edite à mão.',
  '',
  'Como usar: gere cada imagem no seu gerador preferido e envie pela tela **Galeria** do jogo publicado (como dono ou editor), na vaga correspondente. Proporção sugerida: **16:9** para locais, **4:5** para retratos, **4:3** para objetos. Imagens coloridas são exibidas em preto e branco, exceto as vagas marcadas com o vermelho preservado.',
  '',
  `Estilo comum a todos os prompts: \`${NOIR_STYLE}\``,
  '',
];
for (const [kind, label] of Object.entries(KIND_LABELS)) {
  lines.push(`## ${label}`, '');
  for (const s of IMAGE_SLOTS.filter((x) => x.kind === kind)) {
    lines.push(`### ${s.title} — \`${s.id}\``, '', `${s.caption}${s.bundled ? ` Já tem foto de acervo (${s.bundled.credit}, ${s.bundled.license}); gerar é opcional.` : ''}${s.keepColor ? ' Mantém o vermelho.' : ''}`, '', '```', s.prompt, '```', '');
  }
}
writeFileSync('IMAGE_PROMPTS.md', lines.join('\n'));
console.log(`IMAGE_PROMPTS.md — ${IMAGE_SLOTS.length} vagas`);
