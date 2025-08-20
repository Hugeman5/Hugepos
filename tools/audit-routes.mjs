
#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const SRC_DIR = 'src';
const API_BASE = '/api/';

const linkPatterns = [
  // next/link
  /<Link[^>]+href=(["'])([^"']+)\1/g,
  // plain <a> tags
  /<a[^>]+href=(["'])([^"']+)\1/g,
  // useRouter().push() or router.push()
  /(?:router|useRouter\(\))\.push\((["'])([^"']+)\1/g,
  // fetch() calls
  /fetch\((["'])([^"']+)\1/g,
];

const b = (t) => `\x1b[1m${t}\x1b[0m`;
const g = (t) => `\x1b[32m${t}\x1b[0m`;
const r = (t) => `\x1b[31m${t}\x1b[0m`;
const y = (t) => `\x1b[33m${t}\x1b[0m`;
const m = (t) => `\x1b[35m${t}\x1b[0m`;

async function* getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      if (/\.(tsx|ts)$/.test(res) && !res.includes('node_modules')) {
        yield res;
      }
    }
  }
}

function normalizeDynamicSegment(segment) {
  return segment.startsWith('[') && segment.endsWith(']') ? `:${segment.slice(1, -1).replace('...', '*')}` : segment;
}

async function discoverNextRoutes() {
  const pages = new Set();
  const api = new Set();
  for await (const f of getFiles(path.join(process.cwd(), 'src/app'))) {
    const relPath = path.relative(path.join(process.cwd(), 'src/app'), f);
    const parts = relPath.split(path.sep);

    if (parts.includes('route.ts')) {
      const apiPath = '/' + path.join('api', ...parts.slice(1, -1).map(normalizeDynamicSegment));
      api.add(apiPath.replace(/\\/g, '/'));
    } else if (parts.some(p => p.startsWith('page.'))) {
      const pagePath = '/' + parts.slice(0, -1).map(normalizeDynamicSegment).join('/');
      pages.add(pagePath === '/:' ? '/' : pagePath.replace(/\\/g, '/'));
    }
  }
  return { pages: [...pages].sort(), api: [...api].sort() };
}

async function checkLiveUrl(url, baseUrl) {
    try {
        const res = await fetch(`${baseUrl}${url}`);
        return res.status;
    } catch(e) {
        return 'ERR';
    }
}

async function main() {
  const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = arr[i+1];
      if (next && !next.startsWith('--')) {
        acc[key] = next;
      } else {
        acc[key] = true;
      }
    }
    return acc;
  }, {});
  
  const expectedRoutesFile = args.expected || 'tools/expected-routes.json';
  const checkLive = args['check-live'] || false;
  const baseUrl = args['base'] || 'http://localhost:6012';

  console.log(b('🔍 Auditing routes...'));
  
  let expectedRoutes;
  try {
    const expectedFileContent = await fs.readFile(path.join(process.cwd(), expectedRoutesFile), 'utf8');
    expectedRoutes = JSON.parse(expectedFileContent);
  } catch(e) {
    console.log(y(`Warning: Could not read ${expectedRoutesFile}. Discovering routes dynamically.`));
    expectedRoutes = await discoverNextRoutes();
    await fs.mkdir(path.dirname(path.join(process.cwd(), expectedRoutesFile)), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), expectedRoutesFile), JSON.stringify(expectedRoutes, null, 2), 'utf8');
    console.log(g(`✔ Discovered routes written to ${expectedRoutesFile}.`));
  }
  
  const knownPages = new Set(expectedRoutes.pages);
  const knownApi = new Set(expectedRoutes.api);

  let disallowedCount = 0;
  let unknownApiCount = 0;
  let unknownPageCount = 0;
  
  for await (const f of getFiles(SRC_DIR)) {
    const content = await fs.readFile(f, 'utf8');
    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let url = match[2];
        
        if (url.startsWith('http') || url.startsWith('mailto:')) continue;
        if (url.startsWith(API_BASE)) { // It's an API call
            const apiPath = url.split('?')[0];
            if (apiPath === '/api/kds/tickets') {
                console.log(`${r('Disallowed:')} ${f}\n  └─ ${m(apiPath)} (use /api/kds instead)`);
                disallowedCount++;
            } else if (!knownApi.has(apiPath)) {
                // Check for dynamic path match
                const isDynamicMatch = [...knownApi].some(known => {
                    const regex = new RegExp(`^${known.replace(/:[^/]+/g, '[^/]+')}$`);
                    return regex.test(apiPath);
                });
                if (!isDynamicMatch) {
                    console.log(`${y('Unknown API:')} ${f}\n  └─ ${url}`);
                    unknownApiCount++;
                }
            }
        } else if (url.startsWith('/')) { // It's a page link
             const pagePath = url.split('?')[0];
             if (!knownPages.has(pagePath)) {
                const isDynamicMatch = [...knownPages].some(known => {
                    const regex = new RegExp(`^${known.replace(/:[^/]+/g, '[^/]+')}$`);
                    return regex.test(pagePath);
                });
                 if (!isDynamicMatch) {
                    console.log(`${y('Unknown Page:')} ${f}\n  └─ ${url}`);
                    unknownPageCount++;
                }
             }
        }
      }
    }
  }

  console.log(`\n${b('📊 Audit Summary:')}`);
  console.log(`Disallowed Routes: ${disallowedCount > 0 ? r(disallowedCount) : g(0)}`);
  console.log(`Unknown API Routes: ${unknownApiCount > 0 ? y(unknownApiCount) : g(0)}`);
  console.log(`Unknown Pages: ${unknownPageCount > 0 ? y(unknownPageCount) : g(0)}`);
  
  if (checkLive) {
      console.log(b('\n📡 Checking live endpoints...'));
      for(const route of knownApi) {
          // Skip dynamic routes for now in live check
          if (route.includes(':')) continue;
          const status = await checkLiveUrl(route, baseUrl);
          const statusColor = status === 200 ? g : (status === 404 ? r : y);
          console.log(`  ${statusColor(status)}  ${m('GET')} ${route}`);
      }
  }

  console.log(b('\n✔ Audit complete.'));
}

main().catch(console.error);
