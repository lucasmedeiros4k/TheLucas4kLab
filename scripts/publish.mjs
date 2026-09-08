import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const draft = join(root, 'content', 'draft.json');
const published = join(root, 'content', 'published.json');
const mediaDir = join(root, 'content', 'media');
const flutterAsset = join(root, 'apps', 'liga_app', 'assets', 'content', 'published.json');
const flutterMedia = join(root, 'apps', 'liga_app', 'assets', 'media');

mkdirSync(dirname(flutterAsset), { recursive: true });
copyFileSync(draft, published);
console.log('Publicado: content/draft.json -> content/published.json');

mkdirSync(flutterMedia, { recursive: true });
if (existsSync(mediaDir)) {
  let n = 0;
  for (const name of readdirSync(mediaDir)) {
    if (name.startsWith('.')) continue;
    copyFileSync(join(mediaDir, name), join(flutterMedia, name));
    n++;
  }
  console.log(`Mídia: ${n} arquivo(s) -> apps/liga_app/assets/media/`);
}
