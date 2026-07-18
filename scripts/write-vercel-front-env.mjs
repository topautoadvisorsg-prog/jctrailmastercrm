import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const indexHtmlPath = resolve('packages/twenty-front/build/index.html');
const serverBaseUrl =
  process.env.REACT_APP_SERVER_BASE_URL ?? process.env.SERVER_URL;

if (!serverBaseUrl) {
  console.warn(
    'REACT_APP_SERVER_BASE_URL is not set. Frontend will use Twenty default URL resolution.',
  );
  process.exit(0);
}

const indexHtml = await readFile(indexHtmlPath, 'utf8');
const envConfig = `window._env_ = ${JSON.stringify(
  {
    REACT_APP_SERVER_BASE_URL: serverBaseUrl,
  },
  null,
  2,
)};`;

const updatedIndexHtml = indexHtml.replace(
  /window\._env_ = \{[\s\S]*?\};/,
  envConfig,
);

if (updatedIndexHtml === indexHtml) {
  throw new Error('Could not find Twenty env config block in built index.html');
}

await writeFile(indexHtmlPath, updatedIndexHtml);

console.log(`Injected REACT_APP_SERVER_BASE_URL into ${indexHtmlPath}`);
