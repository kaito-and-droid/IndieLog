#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './cli/init.js';
import { runCommand } from './cli/run.js';
import { previewCommand } from './cli/preview.js';
import { publishCommand } from './cli/publish.js';
import { scheduleCommand } from './cli/schedule.js';
import { serverCommand } from './cli/server.js';

const program = new Command();

program
  .name('indielog')
  .description('Open Devlog Automation Tool - Build in public, automated')
  .version('0.1.0');

program
  .command('init')
  .description('Generate default config file')
  .action(initCommand);

program
  .command('run')
  .description('Run IndieLog pipeline (legacy, use publish instead)')
  .option('--config <path>', 'Path to config file')
  .option('--since <date>', 'Get commits since date')
  .option('--dry-run', 'Run without posting')
  .action(runCommand);

program
  .command('preview')
  .description('Preview devlog without publishing')
  .option('--config <path>', 'Path to config file')
  .option('--since <date>', 'Get commits since date')
  .option('--style <style>', 'Override prompt style (friendly|technical|funny)')
  .action(previewCommand);

program
  .command('publish')
  .description('Generate and publish devlog')
  .option('--config <path>', 'Path to config file')
  .option('--since <date>', 'Get commits since date')
  .option('--platforms <platforms>', 'Comma-separated list of platforms')
  .option('--save-output', 'Save generated content to file')
  .action(publishCommand);

program
  .command('schedule')
  .description('Generate cron/GitHub Actions workflow')
  .option('--time <time>', 'Time to run (HH:MM, default: 09:00)')
  .option('--frequency <freq>', 'Frequency (daily|weekly, default: daily)')
  .option('--output <path>', 'Output path for workflow file')
  .action(scheduleCommand);

program
  .command('server')
  .description('Start REST API server')
  .option('--port <port>', 'Server port (default: 3000)')
  .option('--host <host>', 'Server host (default: localhost)')
  .action(serverCommand);

program.parse();
