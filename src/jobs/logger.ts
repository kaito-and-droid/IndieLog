/**
 * Job Logger - Phase 5
 * JSON log writer for job execution
 */

import { JobLogEntry } from './types.js';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../core/logger.js';

/**
 * Job Logger
 * Writes job logs to JSON files
 */
export class JobLogger {
  private logDir: string;
  private currentLogFile: string;

  constructor(logDir?: string) {
    this.logDir = logDir || join(process.cwd(), '.indielog', 'job-logs');
    this.ensureLogDir();

    // Create log file for today
    const today = new Date().toISOString().split('T')[0];
    this.currentLogFile = join(this.logDir, `jobs-${today}.json`);
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
      logger.debug(`Created job log directory: ${this.logDir}`);
    }
  }

  /**
   * Write log entry
   */
  log(entry: Omit<JobLogEntry, 'timestamp'>): void {
    const logEntry: JobLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    try {
      // Read existing logs
      let logs: JobLogEntry[] = [];
      if (existsSync(this.currentLogFile)) {
        const content = readFileSync(this.currentLogFile, 'utf-8');
        if (content.trim()) {
          logs = JSON.parse(content);
        }
      }

      // Append new entry
      logs.push(logEntry);

      // Write back
      writeFileSync(this.currentLogFile, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to write job log', String(error));
    }
  }

  /**
   * Log info message
   */
  info(jobId: string, message: string, details?: any): void {
    this.log({ jobId, level: 'info', message, details });
  }

  /**
   * Log success message
   */
  success(jobId: string, message: string, details?: any): void {
    this.log({ jobId, level: 'success', message, details });
  }

  /**
   * Log warning message
   */
  warning(jobId: string, message: string, details?: any): void {
    this.log({ jobId, level: 'warning', message, details });
  }

  /**
   * Log error message
   */
  error(jobId: string, message: string, details?: any): void {
    this.log({ jobId, level: 'error', message, details });
  }

  /**
   * Log debug message
   */
  debug(jobId: string, message: string, details?: any): void {
    this.log({ jobId, level: 'debug', message, details });
  }

  /**
   * Get logs for a specific job
   */
  getJobLogs(jobId: string): JobLogEntry[] {
    try {
      if (!existsSync(this.currentLogFile)) {
        return [];
      }

      const content = readFileSync(this.currentLogFile, 'utf-8');
      if (!content.trim()) {
        return [];
      }

      const logs: JobLogEntry[] = JSON.parse(content);
      return logs.filter((log) => log.jobId === jobId);
    } catch (error) {
      logger.error('Failed to read job logs', String(error));
      return [];
    }
  }

  /**
   * Get all logs for today
   */
  getTodaysLogs(): JobLogEntry[] {
    try {
      if (!existsSync(this.currentLogFile)) {
        return [];
      }

      const content = readFileSync(this.currentLogFile, 'utf-8');
      if (!content.trim()) {
        return [];
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to read job logs', String(error));
      return [];
    }
  }

  /**
   * Get logs from a specific date
   */
  getLogsForDate(date: string): JobLogEntry[] {
    const logFile = join(this.logDir, `jobs-${date}.json`);

    try {
      if (!existsSync(logFile)) {
        return [];
      }

      const content = readFileSync(logFile, 'utf-8');
      if (!content.trim()) {
        return [];
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error(`Failed to read logs for ${date}`, String(error));
      return [];
    }
  }

  /**
   * Clear old log files
   */
  cleanup(olderThanDays: number = 30): number {
    // This is a simplified version - in production, you'd scan the directory
    // and delete files older than the specified number of days
    logger.debug(`Cleanup requested for logs older than ${olderThanDays} days`);
    return 0;
  }
}

/**
 * Global job logger instance
 */
export const globalJobLogger = new JobLogger();
