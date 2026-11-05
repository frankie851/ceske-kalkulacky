import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const rules = JSON.parse(readFileSync(join(root, 'rules.json'), 'utf8'));
export const defaults = JSON.parse(readFileSync(join(root, 'defaults.json'), 'utf8'));
