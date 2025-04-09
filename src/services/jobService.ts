import fetch from 'node-fetch';
import config from '../config';
import { logger } from '../utils/logger';

/**
 * Update job status in the CloudFFmpeg backend
 */
export async function updateJobStatus(
  jobId: string,
  status: string,
  outputFile?: string
): Promise<void> {
  try {
    const payload = {
      status,
      ...(outputFile ? { outputFile } : {}),
    };
    
    const response = await fetch(`${config.cloudffmpeg.apiUrl}/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiSecretKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update job status: ${response.status} ${errorText}`);
    }
    
    logger.info(`Updated job status for job ${jobId} to ${status}`);
  } catch (error) {
    logger.error(`Error updating job status for job ${jobId}:`, error);
    throw error;
  }
}