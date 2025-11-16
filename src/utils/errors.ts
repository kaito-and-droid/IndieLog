import chalk from 'chalk';
import { logger } from '../core/logger.js';

/**
 * Custom error types
 */
export class IndieLogError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = 'IndieLogError';
  }
}

export class ConfigError extends IndieLogError {
  constructor(message: string, hint?: string) {
    super(message, hint);
    this.name = 'ConfigError';
  }
}

export class GitError extends IndieLogError {
  constructor(message: string, hint?: string) {
    super(message, hint);
    this.name = 'GitError';
  }
}

export class AIError extends IndieLogError {
  constructor(message: string, hint?: string) {
    super(message, hint);
    this.name = 'AIError';
  }
}

export class PublishError extends IndieLogError {
  constructor(message: string, hint?: string) {
    super(message, hint);
    this.name = 'PublishError';
  }
}

/**
 * Handle errors gracefully and exit
 */
export function handleError(error: unknown): never {
  console.log(); // Add spacing

  if (error instanceof IndieLogError) {
    logger.error(error.message);
    if (error.hint) {
      console.log(chalk.dim('💡 Hint:'), chalk.yellow(error.hint));
    }
  } else if (error instanceof Error) {
    logger.error('An unexpected error occurred');
    console.log(chalk.dim(error.message));

    // Show stack trace in debug mode
    if (process.env.DEBUG) {
      console.log();
      console.log(chalk.dim('Stack trace:'));
      console.log(chalk.dim(error.stack));
    }
  } else {
    logger.error('An unknown error occurred');
    console.log(chalk.dim(String(error)));
  }

  console.log();
  console.log(chalk.dim('Run with DEBUG=1 for more details'));
  console.log();

  process.exit(1);
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
    }
  }) as T;
}
