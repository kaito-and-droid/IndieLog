/**
 * Job Runner - Phase 5
 * Executes jobs and manages their lifecycle
 */

import { Job, JobConfig, JobResult } from './types.js';
import { JobQueue, globalJobQueue } from './queue.js';
import { ConfigLoader } from '../core/config.js';
import { GitFetcher } from '../git/git.js';
import { AISummarizer } from '../ai/ai.js';
import { PublisherManager } from '../publisher/manager.js';
import { logger } from '../core/logger.js';

/**
 * Job Runner
 * Executes different types of jobs
 */
export class JobRunner {
  private queue: JobQueue;

  constructor(queue: JobQueue) {
    this.queue = queue;
  }

  /**
   * Execute a job
   */
  async executeJob(job: Job, configPath?: string): Promise<JobResult> {
    logger.info(`Executing job: ${job.id} (${job.type})`);

    this.queue.updateJobStatus(job.id, 'running');

    try {
      // Load configuration
      const config = ConfigLoader.load(configPath);

      // Check for cancellation
      if (job.cancellationToken?.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      // Fetch commits based on job type
      const since = this.getSinceForJobType(job.type, job.config.since);
      const gitFetcher = new GitFetcher(config);
      const commits = await gitFetcher.fetchCommits(since);

      // Check for cancellation
      if (job.cancellationToken?.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      if (commits.length === 0) {
        logger.warning('No commits found to process');
        const result: JobResult = {
          success: true,
          commits: 0,
          published: 0,
          platforms: [],
        };
        this.queue.updateJobStatus(job.id, 'completed', result);
        return result;
      }

      // Generate AI summary
      const aiSummarizer = new AISummarizer(config);
      const summary = await aiSummarizer.generateSummary(commits);

      // Check for cancellation
      if (job.cancellationToken?.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      // Publish or dry run
      let publishedPlatforms: string[] = [];
      if (!job.config.dryRun) {
        const publisherManager = new PublisherManager(config);
        const results = await publisherManager.publishAll(summary);
        // PublisherManager.publishAll returns {platform, url}[] - all successful
        publishedPlatforms = results.map((r) => r.platform);
      }

      // Create result
      const result: JobResult = {
        success: true,
        commits: commits.length,
        summary,
        published: publishedPlatforms.length,
        platforms: publishedPlatforms,
      };

      this.queue.updateJobStatus(job.id, 'completed', result);
      logger.success(`Job completed: ${job.id}`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if it was a cancellation
      if (errorMessage.includes('cancelled') || job.cancellationToken?.signal.aborted) {
        logger.info(`Job cancelled: ${job.id}`);
        this.queue.updateJobStatus(job.id, 'cancelled', undefined, errorMessage);
      } else {
        logger.error(`Job failed: ${job.id}`, errorMessage);
        this.queue.updateJobStatus(job.id, 'failed', undefined, errorMessage);
      }

      const result: JobResult = {
        success: false,
        commits: 0,
        published: 0,
        platforms: [],
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Get 'since' parameter based on job type
   */
  private getSinceForJobType(type: string, customSince?: string): string | undefined {
    if (customSince) {
      return customSince;
    }

    switch (type) {
      case 'daily':
        return 'today';
      case 'weekly':
        return '7 days ago';
      case 'manual':
      default:
        return undefined; // Use default from config
    }
  }

  /**
   * Run daily devlog job
   */
  async runDailyDevlog(config: JobConfig, configPath?: string): Promise<JobResult> {
    const job = this.queue.createJob('daily', config);
    return await this.executeJob(job, configPath);
  }

  /**
   * Run weekly summary job
   */
  async runWeeklySummary(config: JobConfig, configPath?: string): Promise<JobResult> {
    const job = this.queue.createJob('weekly', config);
    return await this.executeJob(job, configPath);
  }

  /**
   * Run manual publish job
   */
  async runManualPublish(config: JobConfig, configPath?: string): Promise<JobResult> {
    const job = this.queue.createJob('manual', config);
    return await this.executeJob(job, configPath);
  }
}

/**
 * Global job runner instance
 */
export const globalJobRunner = new JobRunner(globalJobQueue);
