import fs from 'fs-extra';
import path from 'path';
import pino from 'pino';

const logger = pino();

export async function generateTenantFiles(
  workspace: string,
  appName: string,
  colorTokens: Record<string, any>,
  programJson: Record<string, any>
): Promise<void> {
  logger.info(`[Generate] Creating tenant files for ${appName}`);

  // Write theme.js
  const themeContent = `
// Generated at build time for tenant: ${appName}
export const colors = ${JSON.stringify(colorTokens, null, 2)};

export const space = (n) => n * 8;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };
export const type = {
  display: { fontSize: 68, fontWeight: '800', letterSpacing: -2 },
  timer: { fontSize: 82, fontWeight: '700', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 21, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  mono: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
};
`;

  await fs.writeFile(
    path.join(workspace, 'apps/engine/src/theme.js'),
    themeContent
  );
  logger.info(`[Generate] theme.js created`);

  // Write program.default.json
  await fs.writeFile(
    path.join(workspace, 'apps/engine/src/data/program.default.json'),
    JSON.stringify(programJson, null, 2)
  );
  logger.info(`[Generate] program.default.json created`);
}

export async function overwriteAssets(workspace: string, assets: Map<string, Buffer>): Promise<void> {
  const assetsDir = path.join(workspace, 'apps/engine/assets');

  for (const [filename, buffer] of assets) {
    const filepath = path.join(assetsDir, filename);
    await fs.writeFile(filepath, buffer);
    logger.info(`[Generate] Overwrote asset: ${filename}`);
  }
}
