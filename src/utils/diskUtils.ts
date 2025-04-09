import { exec } from 'child_process';
import { logger } from './logger';

const DISK_SPACE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // Check every 6 hours
const DISK_SPACE_WARNING_THRESHOLD = 80; // Warn when disk usage exceeds 80%

/**
 * Check available disk space
 */
export function checkDiskSpace(): Promise<{ available: number, used: number, total: number }> {
  return new Promise((resolve, reject) => {
    exec('df -h / --output=size,used,avail | tail -n 1', (error, stdout) => {
      if (error) {
        logger.error('Error checking disk space', error);
        return reject(error);
      }
      
      try {
        // Parse output (size, used, avail)
        const parts = stdout.trim().split(/\s+/);
        const total = parseSize(parts[0]);
        const used = parseSize(parts[1]);
        const available = parseSize(parts[2]);
        
        resolve({ total, used, available });
      } catch (e) {
        logger.error('Error parsing disk space output', e);
        reject(e);
      }
    });
  });
}

/**
 * Parse size strings like "1G", "100M" into MB
 */
function parseSize(sizeStr: string): number {
  const units: Record<string, number> = {
    'K': 1/1024,
    'M': 1,
    'G': 1024,
    'T': 1024 * 1024,
  };
  
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGT])?$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || 'M';
  
  return value * (units[unit] || 1);
}

/**
 * Monitor disk space usage
 */
export function monitorDiskSpace(): void {
  const checkAndLog = async () => {
    try {
      const { total, used } = await checkDiskSpace();
      const usedPercent = (used / total) * 100;
      
      logger.info(`Disk space usage: ${usedPercent.toFixed(2)}% (${used}MB/${total}MB)`);
      
      if (usedPercent > DISK_SPACE_WARNING_THRESHOLD) {
        logger.warn(`Disk space usage is high: ${usedPercent.toFixed(2)}%`);
      }
    } catch (error) {
      logger.error('Failed to check disk space', error);
    }
  };
  
  // Check immediately on startup
  checkAndLog();
  
  // Then schedule regular checks
  setInterval(checkAndLog, DISK_SPACE_CHECK_INTERVAL);
}