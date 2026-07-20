import { simpleGit } from 'simple-git';
import path from 'path';
import pino from 'pino';

const logger = pino();

export async function cloneEngineRepo(engineRepo: string, tag: string, targetDir: string): Promise<void> {
  logger.info(`[Git] Cloning ${engineRepo} @ ${tag} to ${targetDir}`);

  const git = simpleGit();
  await git.clone(engineRepo, targetDir, ['--depth', '1', '--branch', tag]);

  logger.info(`[Git] Clone complete`);
}

export async function installDependencies(workspace: string): Promise<void> {
  logger.info(`[Git] Running npm ci in ${workspace}`);

  const git = simpleGit(workspace);
  await git.raw(['npm', 'ci']);

  logger.info(`[Git] Dependencies installed`);
}
