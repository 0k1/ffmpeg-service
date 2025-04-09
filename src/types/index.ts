// Add any custom types here
export interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputFile?: string;
  }
  
  // Extend Express Request type
  declare global {
    namespace Express {
      interface Request {
        job?: Job;
      }
    }
  }