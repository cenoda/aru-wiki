// Where the build scripts read and write generated data. ARU_GENERATED_DIR redirects the whole
// chain (e.g. to .cache/dump-build/generated) so a dump rebuild never overwrites data/generated.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
export const generatedDir = process.env.ARU_GENERATED_DIR
  ? pathToFileURL(`${resolve(process.env.ARU_GENERATED_DIR)}/`)
  : new URL('data/generated/', root);

export const generatedFile = (f) => new URL(f, generatedDir);
