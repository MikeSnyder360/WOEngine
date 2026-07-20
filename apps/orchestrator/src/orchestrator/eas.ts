import { execa } from 'execa';
import path from 'path';
import pino from 'pino';

const logger = pino();

export async function easBuild(workspace: string, platforms: string[]): Promise<Record<string, string>> {
  const platformsStr = platforms.join(' ');
  logger.info(`[EAS] Running build for ${platformsStr}`);

  const engineDir = path.join(workspace, 'apps/engine');

  try {
    const { stdout } = await execa('eas', ['build', '--platform', platformsStr, '--profile', 'production', '--json'], {
      cwd: engineDir,
    });

    const buildIds: Record<string, string> = {};
    const result = JSON.parse(stdout);

    if (result.build?.id) {
      for (const platform of platforms) {
        buildIds[`${platform}BuildId`] = result.build.id;
      }
    }

    logger.info(`[EAS] Build IDs:`, buildIds);
    return buildIds;
  } catch (error: any) {
    logger.error(`[EAS] Build failed:`, error.message);
    throw new Error(`EAS build failed: ${error.message}`);
  }
}

export async function easSubmit(workspace: string, platforms: string[]): Promise<Record<string, string>> {
  const platformsStr = platforms.join(' ');
  logger.info(`[EAS] Running submit for ${platformsStr}`);

  const engineDir = path.join(workspace, 'apps/engine');

  try {
    const { stdout } = await execa('eas', ['submit', '--platform', platformsStr, '--profile', 'production', '--json'], {
      cwd: engineDir,
    });

    const submitIds: Record<string, string> = {};
    const result = JSON.parse(stdout);

    if (result.submission?.id) {
      for (const platform of platforms) {
        submitIds[`${platform}SubmitId`] = result.submission.id;
      }
    }

    logger.info(`[EAS] Submit IDs:`, submitIds);
    return submitIds;
  } catch (error: any) {
    logger.error(`[EAS] Submit failed:`, error.message);
    throw new Error(`EAS submit failed: ${error.message}`);
  }
}
