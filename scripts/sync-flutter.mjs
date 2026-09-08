import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const published = join(root, 'content', 'published.json');
const flutterAsset = join(root, 'apps', 'liga_app', 'assets', 'content', 'published.json');

mkdirSync(dirname(flutterAsset), { recursive: true });
copyFileSync(published, flutterAsset);
console.log('Sincronizado: content/published.json -> apps/liga_app/assets/content/published.json');
