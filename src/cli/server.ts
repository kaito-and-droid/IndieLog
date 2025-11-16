/**
 * Server Command - Phase 7
 * Start REST API server
 */

import chalk from 'chalk';
import { logger } from '../core/logger.js';
import { withErrorHandling } from '../utils/errors.js';
import { IndieLogServer } from '../api/server.js';

interface ServerOptions {
  port?: number;
  host?: string;
}

async function serverCommandInternal(options: ServerOptions) {
  const port = parseInt(options.port?.toString() || '3000');
  const host = options.host || 'localhost';

  console.log();
  console.log(chalk.bold.blue('🖥️  IndieLog Server'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  logger.info('Starting REST API server...');
  console.log();

  // Create and start server
  const server = new IndieLogServer({ port, host });

  try {
    await server.start();

    console.log();
    console.log(chalk.green.bold('✨ Server Started Successfully!'));
    console.log();
    console.log(chalk.white('API Endpoints:'));
    console.log(chalk.dim('  • GET  /status'));
    console.log(chalk.dim('  • GET  /logs'));
    console.log(chalk.dim('  • GET  /logs/live (SSE)'));
    console.log(chalk.dim('  • POST /run'));
    console.log(chalk.dim('  • POST /publish'));
    console.log(chalk.dim('  • GET  /projects'));
    console.log(chalk.dim('  • POST /projects/select'));
    console.log(chalk.dim('  • GET  /config'));
    console.log(chalk.dim('  • POST /config/update'));
    console.log();
    console.log(chalk.cyan('API Documentation:'), `http://${host}:${port}/`);
    console.log();
    console.log(chalk.yellow('Press Ctrl+C to stop'));
    console.log();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log();
      logger.info('Shutting down server...');
      await server.stop();
      console.log();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log();
      logger.info('Shutting down server...');
      await server.stop();
      console.log();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error.message : String(error));
    console.log();
    process.exit(1);
  }
}

export const serverCommand = withErrorHandling(serverCommandInternal);
