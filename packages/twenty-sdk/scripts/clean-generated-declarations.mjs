import { rm, readdir } from 'node:fs/promises';
const distPath = new URL('../dist/', import.meta.url);
const declarationDirs = [
  'define',
  'billing',
  'front-component',
  'logic-function',
  'utils',
];

await rm(new URL('sdk', distPath), { recursive: true, force: true });

const removeDeclarations = async (directoryUrl) => {
  let entries = [];

  try {
    entries = await readdir(directoryUrl, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const entryUrl = new URL(
        `${entry.name}${entry.isDirectory() ? '/' : ''}`,
        directoryUrl,
      );

      if (entry.isDirectory()) {
        await removeDeclarations(entryUrl);

        return;
      }

      if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.d.ts.map')) {
        await rm(entryUrl, { force: true });
      }
    }),
  );
};

await Promise.all(
  declarationDirs.map((directory) =>
    removeDeclarations(new URL(`${directory}/`, distPath)),
  ),
);
