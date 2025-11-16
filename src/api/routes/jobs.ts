/**
 * Jobs Routes - Phase 7
 * POST /run and POST /publish endpoints
 */

import { Router, Request, Response } from 'express';
import { globalJobRunner, JobConfig } from '../../jobs/index.js';
import { ConfigLoader } from '../../core/config.js';

export const jobsRouter = Router();

/**
 * POST /run
 * Run a devlog generation job
 */
jobsRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const { type, since, dryRun, platforms, configPath } = req.body;

    // Load config
    const config = ConfigLoader.load(configPath);

    // Create job config
    const jobConfig: JobConfig = {
      type: type || 'manual',
      projectName: config.projectName,
      since,
      dryRun: dryRun ?? true, // Default to dry run for safety
      platforms: platforms?.split(',').map((p: string) => p.trim()),
    };

    // Execute job based on type
    let result;
    if (type === 'daily') {
      result = await globalJobRunner.runDailyDevlog(jobConfig, configPath);
    } else if (type === 'weekly') {
      result = await globalJobRunner.runWeeklySummary(jobConfig, configPath);
    } else {
      result = await globalJobRunner.runManualPublish(jobConfig, configPath);
    }

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Job execution failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /publish
 * Publish devlog to platforms
 */
jobsRouter.post('/publish', async (req: Request, res: Response) => {
  try {
    const { since, platforms, configPath } = req.body;

    // Load config
    const config = ConfigLoader.load(configPath);

    // Create job config
    const jobConfig: JobConfig = {
      type: 'manual',
      projectName: config.projectName,
      since,
      dryRun: false, // Publish for real
      platforms: platforms?.split(',').map((p: string) => p.trim()),
    };

    // Execute publish job
    const result = await globalJobRunner.runManualPublish(jobConfig, configPath);

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Publish failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
