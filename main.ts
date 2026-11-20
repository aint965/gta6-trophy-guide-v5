// Build the offline Leonida Ledger submission with Node's standard library only.
// MAKEFUN_OUTPUT_DIR is the local stand-in for /output; node main.ts is the platform entrypoint.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appPath = join(repository, 'app');
const screenshotsPath = join(repository, 'screenshots');

mkdirSync(destination, { recursive: true });
cpSync(appPath, join(destination, 'app'), { recursive: true });
mkdirSync(join(destination, 'screenshots'), { recursive: true });
if (existsSync(screenshotsPath)) cpSync(screenshotsPath, join(destination, 'screenshots'), { recursive: true });

const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
