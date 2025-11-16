import chalk from 'chalk';
import { appendFileSync, existsSync, mkdirSync, statSync, renameSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LoggerOptions {
  logToFile?: boolean;
  logDir?: string;
  maxLogSize?: number; // in bytes
  maxLogFiles?: number;
}

/**
 * Centralized logging utility with emoji support and file rotation
 */
export class Logger {
  private startTime: number = 0;
  private options: LoggerOptions;
  private currentLogFile?: string;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      logToFile: options.logToFile ?? false,
      logDir: options.logDir ?? join(process.cwd(), '.indielog', 'logs'),
      maxLogSize: options.maxLogSize ?? 5 * 1024 * 1024, // 5MB default
      maxLogFiles: options.maxLogFiles ?? 10,
    };

    if (this.options.logToFile) {
      this.initializeLogFile();
    }
  }

  /**
   * Initialize log file and directory
   */
  private initializeLogFile(): void {
    const logDir = this.options.logDir!;

    // Create log directory if it doesn't exist
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Create new log file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.currentLogFile = join(logDir, `indielog-${timestamp}.log`);
  }

  /**
   * Write to log file
   */
  private writeToFile(level: LogLevel, message: string, details?: string): void {
    if (!this.options.logToFile || !this.currentLogFile) return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${details ? ' - ' + details : ''}\n`;

    try {
      // Check if rotation is needed
      if (existsSync(this.currentLogFile)) {
        const stats = statSync(this.currentLogFile);
        if (stats.size >= this.options.maxLogSize!) {
          this.rotateLogFiles();
        }
      }

      appendFileSync(this.currentLogFile, logEntry, 'utf-8');
    } catch (error) {
      // Silently fail to avoid infinite loop
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log files when max size is reached
   */
  private rotateLogFiles(): void {
    const logDir = this.options.logDir!;

    try {
      // Get all log files sorted by modification time
      const logFiles = readdirSync(logDir)
        .filter(file => file.startsWith('indielog-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: join(logDir, file),
          mtime: statSync(join(logDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Delete oldest files if we exceed max count
      if (logFiles.length >= this.options.maxLogFiles!) {
        const filesToDelete = logFiles.slice(this.options.maxLogFiles! - 1);
        filesToDelete.forEach(file => {
          try {
            unlinkSync(file.path);
          } catch (error) {
            // Ignore deletion errors
          }
        });
      }

      // Create new log file
      this.initializeLogFile();
    } catch (error) {
      // Silently fail
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Log informational message
   */
  info(message: string, details?: string): void {
    console.log(chalk.blue('ℹ️'), chalk.white(message), details ? chalk.dim(details) : '');
    this.writeToFile('info', message, details);
  }

  /**
   * Log success message
   */
  success(message: string, details?: string): void {
    console.log(chalk.green('✅'), chalk.white(message), details ? chalk.dim(details) : '');
    this.writeToFile('success', message, details);
  }

  /**
   * Log warning message
   */
  warning(message: string, details?: string): void {
    console.log(chalk.yellow('⚠️'), chalk.white(message), details ? chalk.dim(details) : '');
    this.writeToFile('warning', message, details);
  }

  /**
   * Log error message
   */
  error(message: string, details?: string): void {
    console.error(chalk.red('❌'), chalk.white(message), details ? chalk.dim(details) : '');
    this.writeToFile('error', message, details);
  }

  /**
   * Log debug message (only to file, not console)
   */
  debug(message: string, details?: string): void {
    this.writeToFile('debug', message, details);
  }

  /**
   * Log step in pipeline
   */
  step(message: string): void {
    console.log(chalk.blue('🔹'), chalk.cyan(message));
  }

  /**
   * Log section header
   */
  header(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.dim('─'.repeat(50)));
  }

  /**
   * Log section footer
   */
  footer(): void {
    console.log(chalk.dim('─'.repeat(50)));
    console.log();
  }

  /**
   * Start timing
   */
  startTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime;
    return (elapsed / 1000).toFixed(2);
  }

  /**
   * Log separator
   */
  separator(): void {
    console.log();
  }

  /**
   * Log dimmed message
   */
  dim(message: string): void {
    console.log(chalk.dim(message));
  }

  /**
   * Log final summary
   */
  summary(stats: {
    commits: number;
    summaryLength: number;
    published: number;
    platforms: string[];
  }): void {
    console.log();
    console.log(chalk.green.bold('✨ Pipeline Summary'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(chalk.white('Commits processed:'), chalk.cyan(stats.commits.toString()));
    console.log(chalk.white('Summary length:'), chalk.cyan(`${stats.summaryLength} characters`));

    if (stats.published > 0) {
      console.log(chalk.white('Published to:'), chalk.cyan(stats.platforms.join(', ')));
    } else {
      console.log(chalk.white('Published to:'), chalk.dim('none (dry run)'));
    }

    console.log(chalk.white('Total time:'), chalk.cyan(`${this.getElapsedTime()}s`));
    console.log(chalk.dim('─'.repeat(50)));
    console.log();
  }

  /**
   * Log list item
   */
  listItem(message: string, details?: string): void {
    console.log(chalk.green('  •'), chalk.white(message), details ? chalk.dim(details) : '');
  }

  /**
   * Clear line and move cursor up (for progress updates)
   */
  clearLine(): void {
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[K');
    }
  }

  /**
   * Log inline progress (no newline)
   */
  progress(message: string): void {
    if (process.stdout.isTTY) {
      process.stdout.write(chalk.dim(`⏳ ${message}...`));
    }
  }

  /**
   * Complete progress message
   */
  progressDone(message: string): void {
    if (process.stdout.isTTY) {
      this.clearLine();
    }
    this.success(message);
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();
