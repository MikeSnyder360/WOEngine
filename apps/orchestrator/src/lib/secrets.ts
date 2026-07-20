import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import pino from 'pino';

const logger = pino();

let secretsClient: SecretsManagerClient;

export function initSecretsManager(region: string) {
  secretsClient = new SecretsManagerClient({ region });
}

export async function getAppleKey(secretRef: string): Promise<string> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretRef });
    const response = await secretsClient.send(command);
    return response.SecretString || '';
  } catch (error) {
    logger.error(`Failed to decrypt Apple key from ${secretRef}:`, error);
    throw new Error(`Failed to decrypt Apple credentials`);
  }
}

export async function getGoogleServiceAccount(secretRef: string): Promise<Record<string, any>> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretRef });
    const response = await secretsClient.send(command);
    const json = response.SecretString || '{}';
    return JSON.parse(json);
  } catch (error) {
    logger.error(`Failed to decrypt Google SA from ${secretRef}:`, error);
    throw new Error(`Failed to decrypt Google credentials`);
  }
}
