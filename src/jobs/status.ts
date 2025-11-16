/**
 * Job Status Manager - Phase 5
 * Manages and persists job status
 */

import { Job } from './types.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../core/logger.js';

/**
 * Job Status Manager
 * Persists job status to disk
 */
export class JobStatusManager {
  private statusFile: string;
  private statusDir: string;

  constructor(statusDir?: string) {
    this.statusDir = statusDir || join(process.cwd(), '.indielog', 'status');
    this.statusFile = join(this.statusDir, 'jobs.json');
    this.ensureStatusDir();
  }

  /**
   * Ensure status directory exists
   */
  private ensureStatusDir(): void {
    if (!existsSync(this.statusDir)) {
      mkdirSync(this.statusDir, { recursive: true });
      logger.debug(`Created status directory: ${this.statusDir}`);
    }
  }

  /**
   * Save job status
   */
  saveJob(job: Job): void {
    try {
      const jobs = this.loadAllJobs();
      jobs[job.id] = this.serializeJob(job);
      writeFileSync(this.statusFile, JSON.stringify(jobs, null, 2), 'utf-8');
      logger.debug(`Saved job status: ${job.id}`);
    } catch (error) {
      logger.error('Failed to save job status', String(error));
    }
  }

  /**
   * Load job by ID
   */
  loadJob(id: string): Job | null {
    try {
      const jobs = this.loadAllJobs();
      const jobData = jobs[id];
      if (!jobData) {
        return null;
      }
      return this.deserializeJob(jobData);
    } catch (error) {
      logger.error(`Failed to load job ${id}`, String(error));
      return null;
    }
  }

  /**
   * Load all jobs
   */
  loadAllJobs(): Record<string, any> {
    try {
      if (!existsSync(this.statusFile)) {
        return {};
      }

      const content = readFileSync(this.statusFile, 'utf-8');
      if (!content.trim()) {
        return {};
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to load jobs', String(error));
      return {};
    }
  }

  /**
   * Delete job status
   */
  deleteJob(id: string): void {
    try {
      const jobs = this.loadAllJobs();
      delete jobs[id];
      writeFileSync(this.statusFile, JSON.stringify(jobs, null, 2), 'utf-8');
      logger.debug(`Deleted job status: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete job ${id}`, String(error));
    }
  }

  /**
   * Get recent jobs
   */
  getRecentJobs(limit: number = 10): Job[] {
    try {
      const jobs = this.loadAllJobs();
      const jobArray = Object.values(jobs).map((j: any) => this.deserializeJob(j));

      // Sort by created date descending
      jobArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return jobArray.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get recent jobs', String(error));
      return [];
    }
  }

  /**
   * Serialize job for storage
   */
  private serializeJob(job: Job): any {
    return {
      ...job,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      // Don't serialize cancellationToken
      cancellationToken: undefined,
    };
  }

  /**
   * Deserialize job from storage
   */
  private deserializeJob(data: any): Job {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      // Create new cancellation token if needed
      cancellationToken: data.status === 'running' ? new AbortController() : undefined,
    };
  }

  /**
   * Clear all job status
   */
  clear(): void {
    try {
      writeFileSync(this.statusFile, JSON.stringify({}, null, 2), 'utf-8');
      logger.debug('Cleared all job status');
    } catch (error) {
      logger.error('Failed to clear job status', String(error));
    }
  }
}

/**
 * Global job status manager instance
 */
export const globalJobStatus = new JobStatusManager();
