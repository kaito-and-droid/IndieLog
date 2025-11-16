/**
 * Job Types and Interfaces - Phase 5
 */

export type JobType = 'daily' | 'weekly' | 'manual';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobConfig {
  type: JobType;
  projectName: string;
  since?: string;
  dryRun?: boolean;
  platforms?: string[];
}

export interface JobResult {
  success: boolean;
  commits: number;
  summary?: string;
  published: number;
  platforms: string[];
  error?: string;
  duration?: number;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  config: JobConfig;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: JobResult;
  error?: string;
  cancellationToken?: AbortController;
}

export interface JobLogEntry {
  jobId: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}
