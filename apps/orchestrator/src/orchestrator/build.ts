import { Job } from 'bullmq';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';
import { getPrismaClient } from '../lib/db';
import { getAppleKey, getGoogleServiceAccount } from '../lib/secrets';
import { cloneEngineRepo, installDependencies } from './git';
import { generateTenantFiles, overwriteAssets } from './generate';
import { easBuild, easSubmit } from './eas';

const logger = pino();

export interface BuildJob {
  buildId: string;
  platforms: string[];
}

export async function buildOrchestrator(job: Job<BuildJob>) {
  const { buildId, platforms } = job.data;
  const workspaceDir = `/tmp/build-${buildId}`;

  logger.info(`[Build ${buildId}] Starting build for platforms: ${platforms.join(', ')}`);

  try {
    const prisma = getPrismaClient();

    // 1. Load build + related data
    const build = await prisma.build.findUnique({
      where: { id: buildId },
      include: {
        app: { include: { tenant: true } },
        brandManifest: true,
        programVersion: true,
      },
    });

    if (!build || !build.app) throw new Error('Build not found');

    const app = build.app;
    logger.info(`[Build ${buildId}] Building app: ${app.appName}`);

    // Update build status
    await prisma.build.update({
      where: { id: buildId },
      data: { status: 'building', startedAt: new Date() },
    });

    // 2. Decrypt credentials
    const appleKey = await getAppleKey(
      `secret:apple:${app.id}:v1`
    ).catch(() => null);
    const googleSA = await getGoogleServiceAccount(
      `secret:google:${app.id}:v1`
    ).catch(() => null);

    // 3. Clone engine repo
    await cloneEngineRepo(
      'git@github.com:MikeSnyder360/WOEngine.git',
      'v1.0.0-engine',
      workspaceDir
    );

    // 4. Install dependencies
    await installDependencies(workspaceDir);

    // 5. Generate tenant files
    await generateTenantFiles(
      workspaceDir,
      app.appName,
      build.brandManifest?.colorTokens as any,
      build.programVersion?.programJson as any
    );

    // 6. Run eas build
    const buildIds = await easBuild(workspaceDir, platforms);

    // 7. Run eas submit (using injected credentials)
    const submitIds = await easSubmit(workspaceDir, platforms);

    // 8. Update build with IDs
    await prisma.build.update({
      where: { id: buildId },
      data: {
        status: 'succeeded',
        easBuildIdIos: buildIds.iosBuildId || null,
        easBuildIdAndroid: buildIds.androidBuildId || null,
        easSubmitIdIos: submitIds.iosSubmitId || null,
        easSubmitIdAndroid: submitIds.androidSubmitId || null,
        completedAt: new Date(),
      },
    });

    logger.info(`[Build ${buildId}] Build succeeded`);

    return { buildId, status: 'succeeded', platforms };
  } catch (error: any) {
    logger.error(`[Build ${buildId}] Build failed:`, error.message);

    const prisma = getPrismaClient();
    await prisma.build.update({
      where: { id: buildId },
      data: {
        status: 'failed',
        failureReason: error.message.substring(0, 500),
        completedAt: new Date(),
      },
    });

    throw error;
  } finally {
    // 9. Cleanup ephemeral workspace
    logger.info(`[Build ${buildId}] Cleaning up workspace`);
    await fs.remove(workspaceDir).catch(() => {});
  }
}
