import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { logger } from '../core/logger.js';
import { withErrorHandling, ConfigError } from '../utils/errors.js';

const defaultConfig = {
  projectName: "MyProject",
  sources: {
    type: "git",
    path: "."
  },
  ai: {
    provider: "openai",
    model: "gpt-4o-mini",
    promptStyle: "friendly"
  },
  publishers: {
    x: {
      enabled: false
    },
    reddit: {
      enabled: false
    },
    devto: {
      enabled: false
    }
  }
};

async function initCommandInternal() {
  console.log();
  console.log(chalk.bold.blue('🎉 Initialize IndieLog'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();

  const configPath = join(process.cwd(), 'indielog.config.json');

  if (existsSync(configPath)) {
    logger.warning('Config file already exists', configPath);
    logger.dim('Delete it first if you want to regenerate.');
    console.log();
    return;
  }

  try {
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    logger.success('Created config file', configPath);
    logger.separator();

    logger.info('Next steps:');
    console.log(chalk.dim('  1. Edit'), chalk.cyan('indielog.config.json'), chalk.dim('with your project details'));
    console.log(chalk.dim('  2. Set up API keys in'), chalk.cyan('.env'), chalk.dim('file'));
    console.log(chalk.dim('  3. Run:'), chalk.cyan('npx indielog run --dry-run'));
    console.log(chalk.dim('  4. When ready:'), chalk.cyan('npx indielog run'));
    console.log();

    logger.dim('📚 Documentation: https://github.com/kaito-and-droid/IndieLog');
    console.log();
  } catch (error) {
    throw new ConfigError(
      'Failed to create config file',
      'Check if you have write permissions in the current directory'
    );
  }
}

export const initCommand = withErrorHandling(initCommandInternal);
