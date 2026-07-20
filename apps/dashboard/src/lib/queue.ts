import { Queue } from 'bullmq';

let buildQueue: Queue;

export function getQueueInstance(): Queue {
  if (!buildQueue) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    buildQueue = new Queue('builds', { connection: { url: redisUrl } });
  }
  return buildQueue;
}

export async function enqueueBuild(
  buildId: string,
  platforms: string[]
): Promise<void> {
  const queue = getQueueInstance();
  await queue.add('build', { buildId, platforms });
}
