/**
 * Logs Routes - Phase 7
 */

import { Router, Request, Response } from 'express';
import { globalJobLogger } from '../../jobs/logger.js';

export const logsRouter = Router();

/**
 * GET /logs
 * Get job logs
 */
logsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { jobId, date, limit } = req.query;

    let logs;

    if (jobId) {
      logs = globalJobLogger.getJobLogs(jobId as string);
    } else if (date) {
      logs = globalJobLogger.getLogsForDate(date as string);
    } else {
      logs = globalJobLogger.getTodaysLogs();
    }

    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit as string))) {
      logs = logs.slice(0, parseInt(limit as string));
    }

    res.json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get logs',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /logs/live
 * Server-Sent Events for live log streaming
 */
logsRouter.get('/live', (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000); // Every 30 seconds

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });

  // Note: In a production implementation, you'd set up a proper event emitter
  // to stream logs in real-time. For now, this provides the SSE infrastructure.
  // To fully implement:
  // 1. Modify JobLogger to emit events on log writes
  // 2. Subscribe to those events here
  // 3. Send log events to the SSE stream

  // Send sample logs every 5 seconds (for demonstration)
  const logsInterval = setInterval(() => {
    const logs = globalJobLogger.getTodaysLogs().slice(-5);
    if (logs.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'logs', data: logs })}\n\n`);
    }
  }, 5000);

  req.on('close', () => {
    clearInterval(logsInterval);
  });
});
