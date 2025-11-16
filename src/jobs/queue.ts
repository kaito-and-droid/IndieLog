/**
 * Job Queue System - Phase 5
 * Manages job execution and scheduling
 */

import { Job, JobConfig, JobResult, JobStatus, JobType } from './types.js';
import { logger } from '../core/logger.js';
import { randomUUID } from 'crypto';

/**
 * Job Queue
 * Manages pending, running, and completed jobs
 */
export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private runningJobs: Set<string> = new Set();
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 1) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Create a new job
   */
  createJob(type: JobType, config: JobConfig): Job {
    const job: Job = {
      id: randomUUID(),
      type,
      status: 'pending',
      config,
      createdAt: new Date(),
      cancellationToken: new AbortController(),
    };

    this.jobs.set(job.id, job);
    logger.debug(`Job created: ${job.id} (${type})`);

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return this.getAllJobs().filter((job) => job.status === status);
  }

  /**
   * Get jobs by type
   */
  getJobsByType(type: JobType): Job[] {
    return this.getAllJobs().filter((job) => job.type === type);
  }

  /**
   * Update job status
   */
  updateJobStatus(id: string, status: JobStatus, result?: JobResult, error?: string): void {
    const job = this.jobs.get(id);
    if (!job) {
      logger.warning(`Job not found: ${id}`);
      return;
    }

    job.status = status;

    if (status === 'running') {
      job.startedAt = new Date();
      this.runningJobs.add(id);
    } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      job.completedAt = new Date();
      this.runningJobs.delete(id);

      if (result) {
        job.result = result;
        if (job.startedAt) {
          job.result.duration = job.completedAt.getTime() - job.startedAt.getTime();
        }
      }

      if (error) {
        job.error = error;
      }
    }

    logger.debug(`Job ${id} status: ${status}`);
  }

  /**
   * Cancel a job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) {
      logger.warning(`Job not found: ${id}`);
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      logger.warning(`Cannot cancel ${job.status} job: ${id}`);
      return false;
    }

    // Signal cancellation
    job.cancellationToken?.abort();

    // Update status
    this.updateJobStatus(id, 'cancelled');

    logger.info(`Job cancelled: ${id}`);
    return true;
  }

  /**
   * Check if can run more jobs
   */
  canRunJob(): boolean {
    return this.runningJobs.size < this.maxConcurrent;
  }

  /**
   * Get next pending job
   */
  getNextPendingJob(): Job | undefined {
    const pendingJobs = this.getJobsByStatus('pending');
    return pendingJobs[0];
  }

  /**
   * Remove old completed jobs
   */
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt &&
        now - job.completedAt.getTime() > olderThanMs
      ) {
        this.jobs.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cleaned up ${removed} old jobs`);
    }

    return removed;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      total: this.jobs.size,
      pending: this.getJobsByStatus('pending').length,
      running: this.runningJobs.size,
      completed: this.getJobsByStatus('completed').length,
      failed: this.getJobsByStatus('failed').length,
      cancelled: this.getJobsByStatus('cancelled').length,
    };
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.jobs.clear();
    this.runningJobs.clear();
    logger.debug('Job queue cleared');
  }
}

/**
 * Global job queue instance
 */
export const globalJobQueue = new JobQueue(1);
