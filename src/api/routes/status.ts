/**
 * Status Routes - Phase 7
 */

import { Router, Request, Response } from 'express';
import { globalJobQueue } from '../../jobs/queue.js';
import { globalJobStatus } from '../../jobs/status.js';

export const statusRouter = Router();

/**
 * GET /status
 * Get system status
 */
statusRouter.get('/', async (req: Request, res: Response) => {
  try {
    const queueStats = globalJobQueue.getStats();
    const recentJobs = globalJobStatus.getRecentJobs(5);

    res.json({
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      queue: queueStats,
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        result: job.result,
      })),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
