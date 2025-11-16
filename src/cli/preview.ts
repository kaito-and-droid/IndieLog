/**
 * Preview Command - Phase 6
 * Generate and preview devlog without publishing
 */

import chalk from 'chalk';
import { ConfigLoader } from '../core/config.js';
import { GitFetcher } from '../git/git.js';
import { AISummarizer } from '../ai/ai.js';
import { logger } from '../core/logger.js';
import { withErrorHandling } from '../utils/errors.js';

interface PreviewOptions {
  config?: string;
  since?: string;
  style?: 'friendly' | 'technical' | 'funny';
}

async function previewCommandInternal(options: PreviewOptions) {
  logger.startTimer();

  // Header
  console.log();
  console.log(chalk.bold.blue('👁️  IndieLog Preview'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  // Load config
  logger.step('Loading configuration...');
  const config = ConfigLoader.load(options.config);

  // Override style if provided
  if (options.style) {
    config.ai.promptStyle = options.style;
  }

  ConfigLoader.display(config);

  // Fetch commits
  logger.step('Fetching commits from git...');
  const gitFetcher = new GitFetcher(config);
  const commits = await gitFetcher.fetchCommits(options.since);
  GitFetcher.display(commits);

  if (commits.length === 0) {
    logger.warning('No commits found to preview');
    logger.dim('Try adjusting the --since parameter or make some commits first.');
    console.log();
    return;
  }

  // Generate AI summary
  logger.step('Generating AI preview...');
  const aiSummarizer = new AISummarizer(config);
  const summary = await aiSummarizer.generateSummary(commits);

  // Display preview
  console.log();
  console.log(chalk.bold.cyan('📝 Generated Content Preview:'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log();
  console.log(chalk.white(summary));
  console.log();
  console.log(chalk.dim('─'.repeat(50)));
  console.log(chalk.dim(`Length: ${summary.length} characters`));
  console.log();

  // Display platform-specific previews
  console.log(chalk.bold.cyan('📱 Platform Previews:'));
  console.log();

  // Twitter/X preview (280 chars)
  if (config.publishers.x?.enabled) {
    const twitterPreview = summary.length > 280 ? summary.substring(0, 277) + '...' : summary;
    console.log(chalk.green('  X/Twitter:'));
    console.log(chalk.dim(`  ${twitterPreview}`));
    console.log(chalk.dim(`  (${twitterPreview.length}/280 characters)`));
    console.log();
  }

  // Bluesky preview (300 chars)
  if (config.publishers.bluesky?.enabled) {
    const blueskyPreview = summary.length > 300 ? summary.substring(0, 297) + '...' : summary;
    console.log(chalk.green('  Bluesky:'));
    console.log(chalk.dim(`  ${blueskyPreview}`));
    console.log(chalk.dim(`  (${blueskyPreview.length}/300 characters)`));
    console.log();
  }

  // Reddit preview
  if (config.publishers.reddit?.enabled) {
    console.log(chalk.green('  Reddit:'));
    console.log(chalk.dim(`  ${summary}`));
    console.log();
  }

  // Summary
  console.log(chalk.green.bold('✨ Preview Complete'));
  console.log(chalk.dim(`Generated in ${logger.getElapsedTime()}s`));
  console.log();
  console.log(chalk.yellow('To publish, run:'), chalk.cyan('npx indielog publish'));
  console.log();
}

export const previewCommand = withErrorHandling(previewCommandInternal);
