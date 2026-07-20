export interface Config {
  databaseUrl: string;
  redisUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  awsRegion: string;
  easToken: string;
  engineRepo: string;
  nodeEnv: string;
}

export function loadConfig(): Config {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisUrlObj = new URL(redisUrl);

  return {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/woengine_dev',
    redisUrl,
    redisHost: redisUrlObj.hostname || 'localhost',
    redisPort: parseInt(redisUrlObj.port || '6379'),
    redisPassword: redisUrlObj.password,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    easToken: process.env.EAS_TOKEN || '',
    engineRepo: process.env.ENGINE_REPO || 'git@github.com:MikeSnyder360/WOEngine.git',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
