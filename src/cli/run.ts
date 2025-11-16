import chalk from 'chalk';
import { ConfigLoader } from '../core/config.js';
import { GitFetcher } from '../git/git.js';
import { AISummarizer } from '../ai/ai.js';
import { PublisherManager } from '../publisher/manager.js';
import { logger } from '../core/logger.js';
import { withErrorHandling } from '../utils/errors.js';

interface RunOptions {
  config?: string;
  since?: string;
  dryRun?: boolean;
}

async function runCommandInternal(options: RunOptions) {
  // Start timer
  logger.startTimer();

  // Pipeline header
  console.log();
  console.log(chalk.bold.blue('🚀 IndieLog Pipeline'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  // Show dry run warning
  if (options.dryRun) {
    logger.warning('Dry run mode - no posts will be published');
    logger.separator();
  }

  // Step 1: Load config
  logger.step('Loading configuration...');
  const config = ConfigLoader.load(options.config);
  ConfigLoader.display(config);

  // Step 2: Fetch commits
  logger.step('Fetching commits from git...');
  const gitFetcher = new GitFetcher(config);
  const commits = await gitFetcher.fetchCommits(options.since);
  GitFetcher.display(commits);

  if (commits.length === 0) {
    logger.warning('No commits found to process');
    logger.dim('Try adjusting the --since parameter or make some commits first.');
    logger.separator();
    return;
  }

  // Step 3: Generate AI summary
  logger.step('Generating AI summary...');
  const aiSummarizer = new AISummarizer(config);
  const summary = await aiSummarizer.generateSummary(commits);
  AISummarizer.display(summary);

  // Step 4: Publish or dry run
  let publishedPlatforms: string[] = [];

  if (options.dryRun) {
    logger.success('Dry run completed!');
    logger.dim('Run without --dry-run to publish to your platforms.');
    logger.separator();
  } else {
    logger.step('Publishing to platforms...');
    const publisherManager = new PublisherManager(config);
    const results = await publisherManager.publishAll(summary);
    PublisherManager.displaySummary(results);
    publishedPlatforms = results.map((r) => r.platform);
  }

  // Final summary
  logger.summary({
    commits: commits.length,
    summaryLength: summary.length,
    published: publishedPlatforms.length,
    platforms: publishedPlatforms,
  });

  logger.success('Pipeline completed successfully!');
  console.log();
}

export const runCommand = withErrorHandling(runCommandInternal);
