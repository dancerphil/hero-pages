import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const bucket = 'hero-pages-images';
const tmp = '.wrangler/tmp/r2';

rmSync('.wrangler/state/v3/r2', { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

execFileSync('rclone', ['copy', `r2:${bucket}`, tmp], { stdio: 'inherit' });

const objects = JSON.parse(
    execFileSync('rclone', ['lsjson', '-R', '--files-only', '--metadata', `r2:${bucket}`], { encoding: 'utf8' }),
) as { Path: string; MimeType: string }[];

for (const { Path, MimeType } of objects) {
    execFileSync(
        'pnpm',
        ['exec', 'wrangler', 'r2', 'object', 'put', `${bucket}/${Path}`, '--local', '--file', `${tmp}/${Path}`, '--content-type', MimeType],
        { stdio: 'inherit' },
    );
}
