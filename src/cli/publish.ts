/**
 * Publish Command - Phase 6
 * Publish devlog to configured platforms
 */

import chalk from 'chalk';
import { ConfigLoader } from '../core/config.js';
import { GitFetcher } from '../git/git.js';
import { AISummarizer } from '../ai/ai.js';
import { PublisherManager } from '../publisher/manager.js';
import { logger } from '../core/logger.js';
import { withErrorHandling } from '../utils/errors.js';
import { globalJobRunner, JobConfig } from '../jobs/index.js';

interface PublishOptions {
  config?: string;
  since?: string;
  platforms?: string;
  saveOutput?: boolean;
}

async function publishCommandInternal(options: PublishOptions) {
  logger.startTimer();

  // Header
  console.log();
  console.log(chalk.bold.blue('🚀 IndieLog Publish'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  // Load config
  logger.step('Loading configuration...');
  const config = ConfigLoader.load(options.config);
  ConfigLoader.display(config);

  // Create job config
  const jobConfig: JobConfig = {
    type: 'manual',
    projectName: config.projectName,
    since: options.since,
    dryRun: false,
    platforms: options.platforms?.split(',').map((p) => p.trim()),
  };

  // Execute job
  logger.step('Executing publish job...');
  const result = await globalJobRunner.runManualPublish(jobConfig, options.config);

  // Display results
  console.log();
  if (result.success) {
    console.log(chalk.green.bold('✨ Published Successfully!'));
    console.log();
    console.log(chalk.white('Commits processed:'), chalk.cyan(result.commits.toString()));
    console.log(chalk.white('Published to:'), chalk.cyan(result.platforms.join(', ')));
    console.log(chalk.white('Total time:'), chalk.cyan(`${logger.getElapsedTime()}s`));
    console.log();

    // Save output if requested
    if (options.saveOutput && result.summary) {
      const { writeFileSync, existsSync, mkdirSync } = await import('fs');
      const { join } = await import('path');

      const outputDir = join(process.cwd(), '.indielog', 'output');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const outputFile = join(outputDir, `devlog-${timestamp}.txt`);
      writeFileSync(outputFile, result.summary, 'utf-8');

      logger.success('Saved output to', outputFile);
      console.log();
    }
  } else {
    console.log(chalk.red.bold('❌ Publish Failed'));
    console.log();
    if (result.error) {
      console.log(chalk.red('Error:'), result.error);
    }
    console.log();
    process.exit(1);
  }
}

export const publishCommand = withErrorHandling(publishCommandInternal);
