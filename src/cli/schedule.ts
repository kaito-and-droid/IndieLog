/**
 * Schedule Command - Phase 6
 * Generate cron file for automated scheduling
 */

import chalk from 'chalk';
import { logger } from '../core/logger.js';
import { withErrorHandling } from '../utils/errors.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ScheduleOptions {
  time?: string;
  frequency?: 'daily' | 'weekly';
  output?: string;
}

async function scheduleCommandInternal(options: ScheduleOptions) {
  console.log();
  console.log(chalk.bold.blue('⏰ IndieLog Schedule'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  const frequency = options.frequency || 'daily';
  const time = options.time || '09:00';

  // Parse time
  const [hours, minutes] = time.split(':').map((n) => parseInt(n));

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    logger.error('Invalid time format. Use HH:MM (e.g., 09:00)');
    process.exit(1);
  }

  // Generate cron expression
  let cronExpression: string;
  if (frequency === 'daily') {
    cronExpression = `${minutes} ${hours} * * *`;
  } else if (frequency === 'weekly') {
    // Weekly on Monday at specified time
    cronExpression = `${minutes} ${hours} * * 1`;
  } else {
    logger.error(`Invalid frequency: ${frequency}`);
    process.exit(1);
  }

  logger.info(`Frequency: ${frequency}`);
  logger.info(`Time: ${time}`);
  logger.info(`Cron expression: ${cronExpression}`);
  console.log();

  // Generate GitHub Actions workflow
  const workflowContent = generateGitHubAction(cronExpression, frequency);

  // Determine output path
  const outputPath = options.output || join(process.cwd(), '.github', 'workflows', 'indielog.yml');
  const outputDir = join(outputPath, '..');

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    logger.success(`Created directory: ${outputDir}`);
  }

  // Write workflow file
  writeFileSync(outputPath, workflowContent, 'utf-8');
  logger.success(`Created GitHub Actions workflow: ${outputPath}`);
  console.log();

  // Display instructions
  console.log(chalk.bold.cyan('📋 Next Steps:'));
  console.log();
  console.log(chalk.white('1. Commit and push the workflow file:'));
  console.log(chalk.dim(`   git add ${outputPath}`));
  console.log(chalk.dim('   git commit -m "Add IndieLog automation"'));
  console.log(chalk.dim('   git push'));
  console.log();

  console.log(chalk.white('2. Add secrets to your GitHub repository:'));
  console.log(chalk.dim('   Settings → Secrets and variables → Actions → New repository secret'));
  console.log();
  console.log(chalk.cyan('   Required secrets:'));
  console.log(chalk.dim('   - OPENAI_API_KEY or ANTHROPIC_API_KEY'));
  console.log(chalk.dim('   - X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET'));
  console.log(chalk.dim('   - (Optional) REDDIT_*, BLUESKY_* credentials'));
  console.log();

  console.log(chalk.white('3. The workflow will run automatically:'));
  console.log(chalk.dim(`   - ${frequency} at ${time}`));
  console.log(chalk.dim('   - You can also trigger it manually from the Actions tab'));
  console.log();

  // Display crontab alternative
  console.log(chalk.bold.cyan('📋 Alternative: Local Cron'));
  console.log();
  console.log(chalk.white('Add this line to your crontab (crontab -e):'));
  console.log();
  console.log(chalk.cyan(`   ${cronExpression} cd ${process.cwd()} && npx indielog publish`));
  console.log();
}

function generateGitHubAction(cronExpression: string, frequency: string): string {
  return `name: IndieLog ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Post

on:
  schedule:
    - cron: "${cronExpression}"
  workflow_dispatch: # Allow manual trigger

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch all history for git log

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run IndieLog
        run: npx indielog publish
        env:
          # AI Provider (choose one)
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}

          # X/Twitter (required if enabled)
          X_API_KEY: \${{ secrets.X_API_KEY }}
          X_API_SECRET: \${{ secrets.X_API_SECRET }}
          X_ACCESS_TOKEN: \${{ secrets.X_ACCESS_TOKEN }}
          X_ACCESS_SECRET: \${{ secrets.X_ACCESS_SECRET }}

          # Reddit (optional)
          REDDIT_CLIENT_ID: \${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: \${{ secrets.REDDIT_CLIENT_SECRET }}
          REDDIT_USERNAME: \${{ secrets.REDDIT_USERNAME }}
          REDDIT_PASSWORD: \${{ secrets.REDDIT_PASSWORD }}
          REDDIT_SUBREDDIT: \${{ secrets.REDDIT_SUBREDDIT }}

          # Bluesky (optional)
          BLUESKY_HANDLE: \${{ secrets.BLUESKY_HANDLE }}
          BLUESKY_PASSWORD: \${{ secrets.BLUESKY_PASSWORD }}
`;
}

export const scheduleCommand = withErrorHandling(scheduleCommandInternal);
