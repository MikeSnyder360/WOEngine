import { Worker } from 'bullmq';
import pino from 'pino';
import { buildOrchestrator } from './orchestrator/build';
import { loadConfig } from './config';
import { initSecretsManager } from './lib/secrets';

const logger = pino();

async function main() {
  const config = loadConfig();

  // Initialize secrets manager
  initSecretsManager(config.awsRegion);

  logger.info('[Orchestrator] Starting build worker...');
  logger.info(`[Orchestrator] Redis URL: ${config.redisUrl}`);
  logger.info(`[Orchestrator] Database URL: ${config.databaseUrl.split('@')[1]}`); // Hide credentials
  logger.info(`[Orchestrator] AWS Region: ${config.awsRegion}`);

  // Create a queue worker that polls for jobs
  const worker = new Worker('builds', buildOrchestrator, {
    connection: {
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
    },
    concurrency: 1, // EAS builds are long-running; process one at a time
  });

  worker.on('completed', (job) => {
    logger.info(`[Orchestrator] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Orchestrator] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[Orchestrator] Worker error: ${err.message}`);
  });

  logger.info('[Orchestrator] Worker started, listening for jobs...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('[Orchestrator] Shutting down...');
    await worker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
