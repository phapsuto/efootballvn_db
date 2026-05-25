import fs from 'node:fs/promises';
import path from 'node:path';

function parseEnvContent(content) {
  const entries = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.push([key, value]);
  });

  return entries;
}

export async function loadLocalEnv(rootDir = process.cwd()) {
  const candidates = ['.env.local', '.env'];

  for (const fileName of candidates) {
    const filePath = path.resolve(rootDir, fileName);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      parseEnvContent(raw).forEach(([key, value]) => {
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      });
    } catch {
      // Ignore missing env file.
    }
  }
}
