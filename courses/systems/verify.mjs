import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root = resolve('courses');
const map = {
  'ai-interactive-media': ['game-algorithms', 'pixel-tools', 'faucet-synth'],
  'game-planning': ['pulse-core', 'story-branch', 'faucet-synth'],
  'project-planning': ['pixel-tools', 'story-branch', 'game-algorithms'],
};
const errors = [];
const read = path => readFileSync(path, 'utf8');

for (const [course, slugs] of Object.entries(map)) {
  if (new Set(slugs).size !== 3) errors.push(`${course}: systems repeat within course`);
  for (const [i, slug] of slugs.entries()) {
    const week = String(i + 4).padStart(2, '0');
    const file = resolve(root, course, `week${week}.html`);
    const html = read(file);
    const href = `../systems/${slug}/`;
    if ((html.match(new RegExp(href.replaceAll('/', '\\/'), 'g')) || []).length !== 2) errors.push(`${file}: expected slide and notes links`);
    if (!html.includes(`<!-- student-system:${slug} -->`) || !html.includes('課堂任務') || !html.includes('操作任務')) errors.push(`${file}: missing teaching content`);
    if (!existsSync(resolve(dirname(file), href, 'index.html'))) errors.push(`${file}: target missing`);
  }
}

const systems = resolve(root, 'systems');
for (const slug of ['game-algorithms', 'pixel-tools', 'faucet-synth', 'pulse-core', 'story-branch']) {
  const dir = resolve(systems, slug);
  const html = read(resolve(dir, 'index.html'));
  if (!html.includes('name="robots"')) errors.push(`${slug}: missing robots setting`);
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|data:|#|mailto:)/.test(ref)) continue;
    if (!existsSync(resolve(dir, ref.split('#')[0]))) errors.push(`${slug}: missing asset ${ref}`);
  }
  for (const file of readdirSync(dir).filter(name => /\.(?:html|js|jsx|css)$/.test(name))) {
    const content = read(resolve(dir, file));
    if (/tf-private|[CGE]:\\|treefar@gmail|陳修齊|陳教授教授|本校|Aegis|Bulwark|Seraph|燕巢|教育部備案|內政部宗教事務司|yanchao/i.test(content)) errors.push(`${slug}/${file}: private or non-fictional reference`);
  }
}
if (!read(resolve(systems, 'story-branch/index.html')).includes('人物、學校與事件皆為虛構')) errors.push('story-branch: fiction notice missing');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('PASS: 9 week integrations, 5 student systems, local assets and public-content checks');
