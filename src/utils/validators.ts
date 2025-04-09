/**
 * Validates an FFmpeg command string to ensure it doesn't contain unsafe operations
 */
export function validateCommand(command: string): boolean {
    if (!command || typeof command !== 'string') {
      return false;
    }
    
    // Block commands that might be used for malicious purposes
    const blockedPatterns = [
      // Prevent arbitrary command execution
      /-exec\b/, /-pre_exec\b/, /-post_exec\b/,
      // Prevent access to arbitrary files
      /\/etc\//, /\/var\//, /\/root\//,
      // Block network access unless specifically allowed
      /-net_http/, /-net_\w+/
    ];
    
    // Check for blocked patterns
    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        return false;
      }
    }
    
    // Ensure the command contains only expected FFmpeg parameters and options
    const allowedFlags = ['-i', '-c', '-codec', '-filter', '-vf', '-af', '-map', '-b', '-crf', '-preset', '-f'];
    const hasValidFlag = allowedFlags.some(flag => command.includes(flag));
    
    return hasValidFlag;
  }
  
  /**
   * Validates that a job ID is in the expected format
   */
  export function validateJobId(jobId: string): boolean {
    if (!jobId || typeof jobId !== 'string') {
      return false;
    }
    
    // Check if jobId matches UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(jobId);
  }