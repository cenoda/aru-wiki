// The key of a page name in the split data's name list (scripts/split/build.mjs, src/names.ts):
// the name folded like src/route.ts resolvePage (`_` as space, spaces squeezed, lower case), hashed.
// Both sides must agree; the site computes it with Web Crypto, the build with node:crypto.
import { createHash } from 'node:crypto';

export const foldName = (s) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
/** first 12 hex digits of the SHA-256 of the folded name */
export const nameKey = (s) => createHash('sha256').update(foldName(s)).digest('hex').slice(0, 12);
